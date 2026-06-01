"use server";

import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";

const client = new OpenAI();

export type ExtractedTask = {
  title: string;
  description: string | null;
  due_date: string | null; // "YYYY-MM-DD"
  priority: "low" | "medium" | "high" | "urgent";
  assignee_hint: string | null;
  team_hint: string | null;
};

export type ExtractResult =
  | { ok: true; tasks: ExtractedTask[] }
  | { ok: false; error: string };

const EXTRACTED_TASKS_SCHEMA = {
  type: "object" as const,
  properties: {
    tasks: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: { type: ["string", "null"] as const },
          due_date: { type: ["string", "null"] as const },
          priority: {
            type: "string" as const,
            enum: ["low", "medium", "high", "urgent"] as const,
          },
          assignee_hint: { type: ["string", "null"] as const },
          team_hint: { type: ["string", "null"] as const },
        },
        required: [
          "title",
          "description",
          "due_date",
          "priority",
          "assignee_hint",
          "team_hint",
        ] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"] as const,
  additionalProperties: false,
};

function buildDateReference(timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = base.getUTCDay(); // 0=Sun..6=Sat
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  const addDays = (dt: Date, n: number) => {
    const c = new Date(dt);
    c.setUTCDate(c.getUTCDate() + n);
    return c;
  };
  const wd = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const thisMon = addDays(base, mondayOffset);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week = (start: Date) =>
    labels.map((lab, i) => `${lab} ${iso(addDays(start, i))}`).join(", ");

  return [
    `today = ${wd[dow]} ${iso(base)}`,
    `tomorrow = ${iso(addDays(base, 1))}`,
    `this week: ${week(thisMon)}`,
    `next week: ${week(addDays(thisMon, 7))}`,
  ].join("\n");
}

export async function extractTasksFromText(
  rawText: string,
  timezone: string = "America/New_York",
): Promise<ExtractResult> {
  const MAX_CHARS = 10000;

  if (rawText.trim() === "") {
    return { ok: false, error: "No text provided." };
  }

  if (rawText.length > MAX_CHARS) {
    return {
      ok: false,
      error: `Input too long (max ${MAX_CHARS} characters).`,
    };
  }

  const supabase = await createClient();
  const { data: rl, error: rlError } = await supabase.rpc("check_ai_rate_limit");

  if (rlError) {
    console.error(rlError);
    return { ok: false, error: "Rate limit check failed. Please try again." };
  }

  if (rl?.allowed === false) {
    if (rl.reason === "not_authenticated") {
      return { ok: false, error: "You must be signed in to use this feature." };
    }
    if (rl.reason === "minute_limit") {
      return {
        ok: false,
        error: `Too many requests. Try again in ${rl.retry_after_seconds ?? 60} seconds.`,
      };
    }
    if (rl.reason === "day_limit") {
      return { ok: false, error: "Daily limit reached. Try again tomorrow." };
    }
    return { ok: false, error: "Rate limit reached." };
  }

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dateReference = buildDateReference(timezone);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_completion_tokens: 4000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extracted_tasks",
          strict: true,
          schema: EXTRACTED_TASKS_SCHEMA,
        },
      },
      messages: [
        {
          role: "system",
          content: `You extract actionable tasks from unstructured text (meeting notes, emails, braindumps).

Today is ${todayStr} (timezone ${timezone}).

DATE RESOLUTION — follow exactly:
- Do NOT calculate dates yourself. Look them up in this reference table:
${dateReference}
- For 'the Nth' (e.g. 'the 12th'): use the Nth day of the current month if the Nth is today or later this month; otherwise the Nth of next month. Today's day number is the day part of ${todayStr}.
- PRECEDENCE: if a task names both a vague phrase (e.g. 'next week') and a specific date (e.g. 'by the 12th'), the specific date always wins.
- 'end of week' / 'EOD Friday' = this Friday from the table. 'EOD' or 'end of day' with no other reference = today.
- Output due_date as YYYY-MM-DD, or null if no date is implied. Never invent a date that isn't supported by the text.

Rules:
- Only extract genuine, actionable tasks. Ignore greetings, context, and commentary.
- Extract EVERY actionable task, including tasks with no deadline and tasks mentioned in carryover or previous-week sections. Do not skip a task just because it lacks a due date.
- title: a concise imperative phrase.
- priority: one of low, medium, high, urgent. Infer from urgency language. Default to 'medium' if unclear.
- description: brief supporting detail if present, else null.
- assignee_hint: a person's name if the text assigns the task to someone, exactly as written, else null. Do not invent names.
- assignee_hint must reference a SINGLE person. If multiple people are named as owners, choose the primary owner or the first named person.
- team_hint: a team or group name if mentioned, else null.
- If there are no tasks, return an empty array.`,
        },
        {
          role: "user",
          content: rawText,
        },
      ],
    });

    const msg = completion.choices[0].message;
    if (msg.refusal) {
      return { ok: false, error: "Model declined to process this input." };
    }
    if (!msg.content) {
      return { ok: false, error: "Empty response from model." };
    }

    const parsed = JSON.parse(msg.content) as { tasks: ExtractedTask[] };
    return { ok: true, tasks: parsed.tasks };
  } catch (err) {
    console.error("extractTasksFromText failed:", err);
    return {
      ok: false,
      error: "Extraction failed. Please try again.",
    };
  }
}
