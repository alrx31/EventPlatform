import { Check, X } from 'lucide-react';
import { Fragment } from 'react';

interface StepperProps {
    steps: string[];
    current: number;
    rejected?: boolean;
}

export default function Stepper({ steps, current, rejected = false }: StepperProps) {
    return (
        <ol className="card flex flex-wrap items-center gap-3 px-5 py-4">
            {steps.map((label, i) => {
                const state = i < current ? 'done' : i === current ? (rejected ? 'rejected' : 'current') : 'upcoming';
                return (
                    <Fragment key={label}>
                        <li className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                                state === 'done' ? 'bg-success-solid text-white'
                                    : state === 'current' ? 'bg-brand-600 text-white'
                                        : state === 'rejected' ? 'bg-danger-solid text-white'
                                            : 'border border-line-strong bg-white text-subtle'}`}>
                                {state === 'done' ? <Check className="h-4 w-4" /> : state === 'rejected' ? <X className="h-4 w-4" /> : i + 1}
                            </span>
                            <span className={`text-sm ${state === 'current' ? 'font-semibold text-ink' : state === 'upcoming' ? 'font-medium text-subtle' : state === 'rejected' ? 'font-medium text-danger-fg' : 'font-medium text-ink'}`}>{label}</span>
                        </li>
                        {i < steps.length - 1 && (
                            <li aria-hidden="true" className={`hidden h-0.5 min-w-6 flex-1 rounded-full md:block ${i < current ? 'bg-success-solid' : 'bg-line'}`} />
                        )}
                    </Fragment>
                );
            })}
        </ol>
    );
}
