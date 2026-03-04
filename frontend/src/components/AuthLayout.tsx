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
