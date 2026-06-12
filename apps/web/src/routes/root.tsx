import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMe } from "../lib/queries";

const ADMIN_EMAIL = "padilha.matheus@hotmail.com";

function initials(value?: string | null) {
  return (value ?? "")
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const me = useMe(!isLogin);
  const canAccessAdmin = me.data?.user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!isLogin && me.isError && !me.data) {
      navigate({ to: "/login" });
    }
  }, [isLogin, me.data, me.isError, navigate]);

  if (!isLogin && me.isLoading) {
    return <main className="mx-auto max-w-screen-sm p-4">Carregando...</main>;
  }

  return (
    <main
      className={
        isLogin
          ? "min-h-screen"
          : "app-shell mx-auto min-h-screen max-w-screen-sm"
      }
    >
      {!isLogin ? (
        <header className="app-header">
          <div className="app-title">
            <img
              alt="Logo Acipg"
              src="/logo.png"
              width={100}
              height={100}
            ></img>
          </div>
          <div className="app-actions">
            <span className="user-chip">
              {initials(me.data?.user.name ?? me.data?.user.email) || "JD"}
            </span>
          </div>
        </header>
      ) : null}
      <Outlet />
      {!isLogin ? (
        <nav className="bottom-nav">
          <Link
            className={`bottom-nav-item ${location.pathname === "/" ? "is-active" : ""}`}
            to="/"
          >
            <span aria-hidden="true">⌂</span>
            <span>Início</span>
          </Link>
          <Link
            className={`bottom-nav-item ${location.pathname === "/matches" ? "is-active" : ""}`}
            to="/matches"
          >
            <span aria-hidden="true">⚑</span>
            <span>Jogos</span>
          </Link>
          <Link
            className={`bottom-nav-item ${location.pathname === "/ranking" ? "is-active" : ""}`}
            to="/ranking"
          >
            <span aria-hidden="true">▥</span>
            <span>Ranking</span>
          </Link>
          <Link
            className={`bottom-nav-item ${
              location.pathname === "/general" ? "is-active" : ""
            }`}
            to="/general"
          >
            <span aria-hidden="true">◎</span>
            <span>Geral</span>
          </Link>
          {canAccessAdmin ? (
            <Link
              className={`bottom-nav-item ${location.pathname === "/admin" ? "is-active" : ""}`}
              to="/admin"
            >
              <span aria-hidden="true">⚙</span>
              <span>Admin</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
