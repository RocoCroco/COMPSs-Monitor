// src/App.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import BackgroundDots from "./components/visual/BackgroundDots";

export default function App() {
  return (
    <div className="h-screen relative overflow-hidden">
      {/* Fondo global detrás de toda la app */}
      <BackgroundDots />
    <div className="h-screen flex flex-col ">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </div>
    </div>
    </div>
  );
}
