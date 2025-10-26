// src/components/Topbar.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace} from "../lib/workspace-context";
import { deleteWorkspace as apiDeleteWorkspace } from "../lib/workspaces"
import WorkspaceCreateModal from "./modals/WorkspaceCreateModal";
import ConfirmDeleteWorkspaceModal from "./modals/ConfirmDeleteWorkspaceModal";
import FuzzyText from "./visual/FuzzyText";

export default function Topbar() {
  const { currentWorkspace, createAndSelect, refresh } = useWorkspace();
  const [open, setOpen] = useState(false);           // dropdown abierto/cerrado
  const [openCreate, setOpenCreate] = useState(false); // modal crear workspace
  const [askDelete, setAskDelete] = useState(false);
  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    await apiDeleteWorkspace(currentWorkspace.id);
    await refresh();
    navigate("/workspaces/select", { replace: true });
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b sticky top-0 z-20">
      {/* Logo COMPSs a la izquierda */}
      <div className="flex items-center gap-2">
        <img
          src="/src/assets/compss-logo3.png" /* si lo tienes en public/ */
          alt="COMPSs Logo"
          className="h-7 w-auto ml-2"
        />
        <FuzzyText 
          baseIntensity={0.00} 
          hoverIntensity={0.1} 
          enableHover={true}
          color="#000"
          fontSize={20}
        >
          MONITOR
        </FuzzyText>
      </div>

      {/* Acciones a la derecha */}
      <div className="relative">
        {currentWorkspace ? (
          <>
            <button
              ref={buttonRef}
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm bg-white hover:bg-neutral-50 transition"
            >
              <span className="truncate max-w-[220px]">{currentWorkspace.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={["h-4 w-4 transition-transform duration-200", open ? "rotate-180" : "rotate-0"].join(" ")}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.08 1.04l-4.25 4.53a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown con animación */}
            <div
              ref={menuRef}
              className={[
                "absolute right-0 mt-2 w-56 origin-top-right rounded-md border bg-white shadow-lg z-30",
                "transition-all duration-200 ease-out transform",
                open
                  ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 invisible pointer-events-none",
              ].join(" ")}
              role="menu"
              aria-label="workspace menu"
            >
              <ul className="py-1 text-sm">
                <li>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setOpenCreate(true); // ← abre el modal
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50"
                    role="menuitem"
                  >
                    New workspace
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigate("/workspaces/select");
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50"
                    role="menuitem"
                  >
                    Change workspace
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setOpen(false); setAskDelete(true); }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    Delete workspace
                  </button>
                </li>
              </ul>
            </div>

            {/* Modal: crear workspace */}
            <WorkspaceCreateModal
              open={openCreate}
              onClose={() => setOpenCreate(false)}
              onCreate={async (name) => {
                await createAndSelect(name);
                setOpenCreate(false);
                setOpen(false);
                navigate("/agents");
              }}
            />
            {/* Modal de confirmación */}
            <ConfirmDeleteWorkspaceModal
              name={currentWorkspace.name}
              open={askDelete}
              onCancel={() => setAskDelete(false)}
              onConfirm={async () => {
                await handleDeleteWorkspace();
                setAskDelete(false);
              }}
            />
          </>
        ) : null}
      </div>
    </header>
  );
}
