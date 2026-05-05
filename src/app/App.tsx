import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router";
import { LoginPage } from "./components/login";
import { HomePage } from "./components/home";
import { LearnPage } from "./components/learn";
import { TestPage } from "./components/test";
import { ProfilePage } from "./components/profile";
import { AdminPage } from "./components/admin";
import { useAuth } from "./auth";

type RouteId = "home" | "learn" | "test" | "profile" | "admin";

const ROUTE_PATHS: Record<RouteId, string> = {
  home: "/",
  learn: "/learn",
  test: "/test",
  profile: "/profile",
  admin: "/admin",
};

function pathToRouteId(pathname: string): RouteId {
  const entry = Object.entries(ROUTE_PATHS).find(([, p]) => p === pathname);
  return (entry?.[0] as RouteId) ?? "home";
}

export default function App() {
  const { user, loading, logout, role } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const route = pathToRouteId(pathname);
  const setRoute = (id: RouteId) => navigate(ROUTE_PATHS[id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3ecd7]" style={{ fontFamily: "'EB Garamond', 'Times New Roman', Times, serif" }}>
        <p className="italic text-[#7a6a45]">Opening the press…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ fontFamily: "'EB Garamond', 'Times New Roman', Times, serif", color: "#1f1a14" }}>
        <LoginPage />
      </div>
    );
  }

  const isAdmin = role === "admin";

  const nav: { id: RouteId; label: string; jp: string }[] = [
    { id: "home", label: "Home", jp: "案内" },
    { id: "learn", label: "Learn", jp: "学ぶ" },
    { id: "test", label: "Test", jp: "試験" },
    ...(isAdmin ? [{ id: "admin" as RouteId, label: "Admin", jp: "編集" }] : []),
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: "'EB Garamond', 'Times New Roman', Times, serif",
        color: "#1f1a14",
        backgroundColor: "#f3ecd7",
        backgroundImage: "radial-gradient(#d9cfb8 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <Sidebar route={route} setRoute={setRoute} nav={nav} />
      <main className="flex-1 px-10 py-12 overflow-auto">
        <Routes>
          <Route path="/" element={<HomePage onGoLearn={() => setRoute("learn")} onGoTest={() => setRoute("test")} />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/profile" element={<ProfilePage onLogout={logout} />} />
          <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
        </Routes>

        <footer className="max-w-5xl mx-auto mt-16 pt-6 border-t border-[#cdbf9d] italic text-[#7a6a45] flex justify-between" style={{ fontSize: "0.85rem" }}>
          <span>Kotoba Press · Volume I</span>
          <span>Printed in studious silence</span>
        </footer>
      </main>
    </div>
  );
}

function Sidebar({
  route, setRoute, nav,
}: {
  route: RouteId;
  setRoute: (r: RouteId) => void;
  nav: { id: RouteId; label: string; jp: string }[];
}) {
  return (
    <aside className="w-64 border-r border-[#cdbf9d] bg-[#fbf8f1] sticky top-0 self-start min-h-screen flex flex-col">
      <div className="px-6 pt-10 pb-6">
        <p className="tracking-[0.3em] text-[#7a6a45]">日本語</p>
        <p className="italic" style={{ fontSize: "1.6rem" }}>Kotoba Press</p>
        <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>est. 2026 · vol. I</p>
      </div>

      <nav className="flex flex-col px-6">
        {nav.map((n, i) => (
          <button
            key={n.id}
            onClick={() => setRoute(n.id)}
            className={`text-left py-2 border-t border-[#e5dabc] flex justify-between items-baseline ${
              route === n.id ? "italic text-[#1f1a14]" : "text-[#3a2f22] hover:italic"
            } ${i === nav.length - 1 ? "border-b" : ""}`}
          >
            <span>
              <span className="italic text-[#7a6a45] mr-3" style={{ fontSize: "0.8rem" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {n.label}
            </span>
            <span className="text-[#a89770]" style={{ fontSize: "0.85rem" }}>{n.jp}</span>
          </button>
        ))}
      </nav>

      <p className="px-6 mt-8 italic text-[#7a6a45]" style={{ fontSize: "0.8rem" }}>
        “Read carefully, write carefully, think carefully.”
      </p>

      <div className="mt-auto px-3 pb-4">
        <UserPill onOpen={() => setRoute("profile")} active={route === "profile"} />
      </div>
    </aside>
  );
}

function UserPill({ onOpen, active }: { onOpen: () => void; active: boolean }) {
  const { user } = useAuth();
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const initial = name[0] ?? "?";
  return (
    <div
      className={`flex items-center gap-3 p-2 border transition-colors ${
        active ? "border-[#1f1a14] bg-[#efe6cf]" : "border-[#d9cfb8] bg-[#fbf8f1] hover:bg-[#efe6cf]"
      }`}
    >
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <span className="w-9 h-9 rounded-full bg-[#efe6cf] border border-[#cdbf9d] flex items-center justify-center italic shrink-0">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate">{name}</span>
          <span className="block italic text-[#7a6a45] truncate" style={{ fontSize: "0.75rem" }}>
            {email}
          </span>
        </span>
      </button>
      <button
        onClick={onOpen}
        title="Settings"
        className="w-8 h-8 flex items-center justify-center text-[#5e5132] hover:text-[#1f1a14] shrink-0"
      >
        <SettingsIcon />
      </button>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
