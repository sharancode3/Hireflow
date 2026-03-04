import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string;
  rightSlot?: ReactNode;
  wrapperClassName?: string;
};

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
  { label, rightSlot, className, wrapperClassName, value, ...props },
  ref,
) {
  const hasValue = typeof value === "string" ? value.trim().length > 0 : Boolean(value);

  return (
    <label
      className={cn("floating-field", rightSlot ? "has-right-slot" : "", wrapperClassName)}
      data-has-value={hasValue ? "true" : "false"}
    >
      <input
        ref={ref}
        value={value}
        className={cn("input-base floating-field-input", className)}
        {...props}
      />
      <span className="floating-field-label">{label}</span>
      {rightSlot ? <span className="floating-field-right">{rightSlot}</span> : null}
    </label>
  );
});