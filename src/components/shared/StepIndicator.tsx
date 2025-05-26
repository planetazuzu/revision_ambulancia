"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Ambulance, WorkflowStep } from '@/types';
import { CheckCircle, Circle, PlayCircle } from 'lucide-react';

interface StepIndicatorProps {
  steps: WorkflowStep[];
  currentAmbulance: Ambulance;
  basePath: string; // e.g., /dashboard/ambulances/[id]
}

export function StepIndicator({ steps, currentAmbulance, basePath }: StepIndicatorProps) {
  const pathname = usePathname();
  let currentStepIndex = -1;
  let nextStepAvailable = true;

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.isCompleted(currentAmbulance);
          const isCurrent = pathname.endsWith(step.path.substring(step.path.lastIndexOf('/')));
          
          if (isCurrent) {
            currentStepIndex = stepIdx;
          }

          const isDisabled = !nextStepAvailable && !isCompleted;
          if (!isCompleted && nextStepAvailable) {
            nextStepAvailable = false; // Next steps are disabled if current one isn't complete
          }
          
          let Icon = Circle;
          let iconColor = "text-muted-foreground";
          let textColor = "text-muted-foreground";
          let linkPath = `${basePath}${step.path.substring(step.path.lastIndexOf('/'))}`;

          if (isCompleted) {
            Icon = CheckCircle;
            iconColor = "text-green-500";
            textColor = "text-foreground";
          }
          if (isCurrent) {
            Icon = PlayCircle;
            iconColor = "text-primary";
            textColor = "text-primary font-semibold";
          }
          if (isDisabled) {
            iconColor = "text-muted-foreground opacity-50";
            textColor = "text-muted-foreground opacity-50";
          }
          
          return (
            <li key={step.name} className="flex-1">
              {isCompleted || isCurrent || (stepIdx === currentStepIndex +1 && step.isCompleted(currentAmbulance)) ? ( // Allow navigation to completed or current or next available step
                <Link
                  href={isDisabled && !isCurrent ? "#" : linkPath}
                  className={cn(
                    "group flex flex-col items-center border-b-2 py-2 px-1 transition-colors hover:border-primary",
                    isCurrent ? "border-primary" : (isCompleted ? "border-green-500" : "border-transparent"),
                    (isDisabled && !isCurrent) && "pointer-events-none opacity-60"
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="flex items-center text-sm font-medium">
                    <Icon className={cn("h-6 w-6 mr-2", iconColor)} aria-hidden="true" />
                    <span className={cn("hidden sm:block", textColor)}>{step.name}</span>
                  </span>
                </Link>
              ) : (
                <div
                  className={cn(
                    "group flex flex-col items-center border-b-2 py-2 px-1 border-transparent",
                    (isDisabled && !isCurrent) && "pointer-events-none opacity-60"
                  )}
                >
                  <span className="flex items-center text-sm font-medium">
                     <Icon className={cn("h-6 w-6 mr-2", iconColor)} aria-hidden="true" />
                    <span className={cn("hidden sm:block", textColor)}>{step.name}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
