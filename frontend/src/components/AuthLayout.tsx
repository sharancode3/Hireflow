import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="page">
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
