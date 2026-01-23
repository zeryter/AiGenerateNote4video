import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground", className)}>
            {icon && <div className="mb-4">{icon}</div>}
            <div className="text-sm font-medium text-foreground/80">{title}</div>
            {description && <div className="mt-1 text-xs text-muted-foreground/80">{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
