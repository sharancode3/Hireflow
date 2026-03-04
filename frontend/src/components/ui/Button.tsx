import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "relative overflow-hidden bg-gradient-to-r from-[#4F8EF7] to-[#6366F1] text-white shadow-soft hover:shadow-lift before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:-translate-x-full before:bg-white/20 before:blur-md before:transition-transform before:duration-300 hover:before:translate-x-[320%]",
  secondary:
    "border border-border bg-transparent text-text hover:bg-surface-raised",
  ghost: "bg-transparent text-text hover:bg-surface-raised",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", loading, disabled, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={cn("btn-base", variantClasses[variant], isDisabled && "opacity-70 cursor-not-allowed", className)}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : null}
      {children}
    </button>
  );
});
