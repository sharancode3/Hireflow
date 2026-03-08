import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="page-shell">
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

type AuthSplitLayoutProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  bottomBar?: ReactNode;
  pageClassName?: string;
};

export function AuthSplitLayout({ leftPanel, rightPanel, bottomBar, pageClassName }: AuthSplitLayoutProps) {
  const shellClassName = [
    "auth-page-shell",
    bottomBar ? "auth-page-shell--with-bottom" : "",
    pageClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      <div className="auth-split-page">
        <div className="auth-split-layout">
          <aside className="auth-left-panel">{leftPanel}</aside>
          <section className="auth-right-panel">{rightPanel}</section>
        </div>
      </div>
      {bottomBar ? <div className="auth-bottom-bar">{bottomBar}</div> : null}
    </div>
  );
}
