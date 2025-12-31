import { useState } from "react";
import { NavLink } from "react-router-dom";

export function Logo({
  to = "/",
  variant = "full",
}: {
  to?: string;
  variant?: "full" | "mark";
}) {
  const [hasImage, setHasImage] = useState(true);

  return (
    <NavLink
      to={to}
      className="brand"
      aria-label="Talvion Home"
      data-has-image={hasImage ? "true" : "false"}
      data-variant={variant}
    >
      {hasImage ? (
        <img
          className="brand-logo"
          src="/hirehub-logo.png"
          alt="Talvion"
          loading="eager"
          decoding="async"
          onError={() => setHasImage(false)}
        />
      ) : (
        <span className="brand-mark" aria-hidden="true" />
      )}
      {variant === "full" ? <span className="brand-name">Talvion</span> : null}
    </NavLink>
  );
}
