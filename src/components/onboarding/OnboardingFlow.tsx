"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import { completeOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ONBOARDING_TOUR_EVENT = "kalebs:onboarding-tour";

export function relaunchOnboardingTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ONBOARDING_TOUR_EVENT));
  }
}

type OnboardingFlowProps = {
  hasCompletedOnboarding: boolean;
};

export function OnboardingFlow({ hasCompletedOnboarding }: OnboardingFlowProps) {
  const [showModal, setShowModal] = useState(false);
  const completionTriggered = useRef(false);

  const markComplete = useCallback(async () => {
    if (completionTriggered.current) return;
    completionTriggered.current = true;
    const result = await completeOnboarding();
    if (!result.ok) {
      console.error("completeOnboarding failed:", result.error);
    }
  }, []);

  const startTour = useCallback(async () => {
    completionTriggered.current = false;
    const allSteps = [
      {
        element: '[data-tour="nav"]',
        popover: {
          title: "Navigation",
          description:
            "Your navigation — jump between Dashboard, Calendar, Tasks, Teams, and People.",
          side: "right" as const,
        },
      },
      {
        element: '[data-tour="create-task"]',
        popover: {
          title: "Create Tasks",
          description:
            "Create a task here — a single task, or paste meeting notes and let AI pull out multiple tasks for you to review.",
          side: "right" as const,
        },
      },
      {
        element: '[data-tour="stats"]',
        popover: {
          title: "Stats at a glance",
          description:
            "Your open tasks, overdue items, and what's due this week — at a glance.",
          side: "bottom" as const,
        },
      },
      {
        element: '[data-tour="calendar"]',
        popover: {
          title: "Calendar quick view",
          description: "Click any day to see just that day's tasks.",
          side: "left" as const,
        },
      },
      {
        element: '[data-tour="teams"]',
        popover: {
          title: "Teams",
          description:
            "Join a team to see its tasks — request to join from the Teams page, and an admin approves.",
          side: "right" as const,
        },
      },
    ];

    const steps = allSteps.filter((step) => {
      const el = document.querySelector(step.element);
      return el != null;
    });

    if (steps.length === 0) {
      await markComplete();
      return;
    }

    const tour = driver({
      showProgress: true,
      allowClose: true,
      animate: true,
      overlayClickBehavior: "close",
      doneBtnText: "Done",
      nextBtnText: "Next",
      prevBtnText: "Previous",
      onDestroyed: () => {
        void markComplete();
      },
      steps,
    });

    tour.drive();
  }, [markComplete]);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setShowModal(true);
    }
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    const handler = () => {
      void startTour();
    };
    window.addEventListener(ONBOARDING_TOUR_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_TOUR_EVENT, handler);
  }, [startTour]);

  if (hasCompletedOnboarding) return null;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Kalebs Tracker 👋</DialogTitle>
          <DialogDescription>
            Your home for tracking tasks across every team you&apos;re on — create work, see
            what&apos;s due, and keep your teams in sync. Want a quick tour to see how it works?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              setShowModal(false);
              await markComplete();
            }}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setShowModal(false);
              await startTour();
            }}
          >
            Take the tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
