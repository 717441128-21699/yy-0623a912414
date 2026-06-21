import { CheckSquare, ClipboardList, FileCheck2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/checklist", icon: ClipboardList, label: "今日自检" },
  { to: "/rework", icon: CheckSquare, label: "返工清单" },
  { to: "/records", icon: FileCheck2, label: "合格记录" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-site-border bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? "text-site-orange" : "text-site-darkLight"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-b-full bg-site-orange" />
                )}
                <tab.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-body-md font-semibold ${isActive ? "" : "opacity-90"}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
