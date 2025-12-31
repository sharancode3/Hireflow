import { Outlet } from "react-router-dom";
import { AppTopBar } from "./AppTopBar";

export function AppLayout() {
  return (
    <div className="page">
      <AppTopBar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
