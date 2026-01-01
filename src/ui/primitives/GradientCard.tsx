import { ReactNode } from "react";
import { GRADIENTS, SHADOWS } from "../design-system/tokens";
import { cn } from "../../lib/utils";

type GradientVariant = keyof typeof GRADIENTS;

interface GradientCardProps {
    children: ReactNode;
    variant?: GradientVariant;
    className?: string;
    padding?: string;
    shadow?: keyof typeof SHADOWS;
    hoverEffect?: boolean;
}

export function GradientCard({
    children,
    variant = "primary",
    className,
    padding = "p-6",
    shadow,
    hoverEffect = false
}: GradientCardProps) {
    const gradientClass = GRADIENTS[variant];

    // Determine shadow class
    let shadowClass = "";
    if (shadow) {
        shadowClass = SHADOWS[shadow];
    } else {
        // Auto-infer shadow from variant
        if (variant.startsWith("primary")) shadowClass = SHADOWS.primary;
        else if (variant.startsWith("accent")) shadowClass = SHADOWS.accent;
        else if (variant.startsWith("secondary")) shadowClass = SHADOWS.secondary;
        else if (variant.startsWith("warning")) shadowClass = SHADOWS.warning;
        else if (variant.startsWith("success")) shadowClass = SHADOWS.success;
        else if (variant.startsWith("info")) shadowClass = SHADOWS.info;
        else shadowClass = SHADOWS.primary; // Fallback
    }

    return (
        <div
            className={cn(
                "bg-gradient-to-br text-white shadow-lg",
                gradientClass,
                shadowClass,
                padding,
                hoverEffect && "card-shadow-hover transition-all",
                className
            )}
        >
            {children}
        </div>
    );
}
