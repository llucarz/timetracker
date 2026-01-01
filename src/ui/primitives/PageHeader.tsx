import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6", className)}>
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
                {description && (
                    <p className="text-sm sm:text-base text-gray-500 mt-1">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
