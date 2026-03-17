import { NavLink } from "react-router-dom";

export function Logo({
  to = "/",
  variant = "full",
}: {
  to?: string;
  variant?: "full" | "mark";
}) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-2"
      aria-label="Hireflow Home"
      data-variant={variant}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface"
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.1 15.2A6.9 6.9 0 1 1 17 15"
            stroke="#FFFFFF"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          <path
            d="M6.8 14.9L3 18.7"
            stroke="#FFFFFF"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path
            d="M11 12.8H13L12.3 14.1H11.7L11 12.8Z"
            fill="#FFFFFF"
          />
          <path
            d="M11.7 14.1H12.3L12.9 17.2H11.1L11.7 14.1Z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
      {variant === "full" ? <span className="text-base font-semibold tracking-tight">Hireflow</span> : null}
    </NavLink>
  );
}
