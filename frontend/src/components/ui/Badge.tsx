import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type BadgeVariant = "blue" | "teal" | "purple" | "amber" | "red";

const badgeClasses: Record<BadgeVariant, string> = {
  blue: "bg-accent/15 text-accent",
  teal: "bg-accent-teal/15 text-accent-teal",
  purple: "bg-accent-purple/15 text-accent-purple",
  amber: "bg-accent-amber/15 text-accent-amber",
  red: "bg-danger/15 text-danger",
};

export function Badge({
  className,
  variant = "blue",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", badgeClasses[variant], className)}
      {...props}
    />
  );
}
