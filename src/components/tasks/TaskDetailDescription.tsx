type TaskDetailDescriptionProps = {
  description: string | null;
};

export function TaskDetailDescription({ description }: TaskDetailDescriptionProps) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Description
      </p>
      <div className="rounded-lg border border-border bg-white p-4">
        {description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No description provided.</p>
        )}
      </div>
    </div>
  );
}
