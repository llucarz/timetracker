import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SurfaceProps {
    children: ReactNode;
    className?: string;
    padding?: string;
    border?: boolean;
    shadow?: boolean;
    glass?: boolean;
    rounded?: string;
    hoverEffect?: boolean;
}

export function Surface({
    children,
    className,
    padding = "p-5 sm:p-6 lg:p-8",
    border = true,
    shadow = true,
    glass = false,
    rounded = "rounded-2xl sm:rounded-3xl",
    hoverEffect = false
}: SurfaceProps) {
    return (
        <div className={cn(
            glass ? "bg-white/80 backdrop-blur-md" : "bg-white",
            border && "border border-gray-200",
            shadow && "card-shadow",
            rounded,
            padding,
            hoverEffect && "hover:card-shadow-hover transition-all duration-200",
            className
        )}>
            {children}
        </div>
    );
}
