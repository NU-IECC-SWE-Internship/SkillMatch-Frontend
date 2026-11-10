import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { logout } from "../lib/auth";
import BrandIcon from "./BrandIcon";
import NotificationBell from "./NotificationBell";
import "./AppNavbar.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", short: "Dashboard", match: ["/dashboard"] },
  { to: "/skillbrowse", label: "Browse Skills", short: "Browse", match: ["/skillbrowse", "/matches", "/users"] },
  { to: "/requests", label: "Requests", short: "Requests", match: ["/requests", "/my-requests"] },
  { to: "/meetings", label: "Sessions", short: "Sessions", match: ["/meetings"] },
];

// Fetched once per login and shared by every page's navbar.
let cachedUsername: string | null = null;

export default function AppNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [username, setUsername] = useState<string | null>(cachedUsername);
  const [menuOpen, setMenuOpen] = useState(false);
  // Soft shadow under the bar once the page is scrolled
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (match: string[]) => match.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (cachedUsername) return;
    let cancelled = false;
    apiRequest<{ username: string }>("/api/auth/me/")
      .then((me) => {
        cachedUsername = me.username;
        if (!cancelled) setUsername(me.username);
      })
      .catch(() => {
        // Not critical: the avatar falls back to "?".
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function go(to: string) {
    setMenuOpen(false);
    navigate(to);
  }

  function handleLogout() {
    setMenuOpen(false);
    cachedUsername = null;
    logout();
    navigate("/login", { replace: true });
  }

  const initial = username ? username.charAt(0).toUpperCase() : "?";
  // Account-menu pages: profile and quizzes (quiz pages live at /skills/:id/quiz)
  const onProfile = ["/profile", "/quizzes", "/skills"].some((prefix) => pathname.startsWith(prefix));

  return (
    <header className={scrolled ? "app-navbar scrolled" : "app-navbar"}>
      <div className="app-navbar-main">
        <button type="button" className="app-navbar-brand" onClick={() => navigate("/dashboard")}>
          <BrandIcon className="app-navbar-brand-icon" />
          <span>SkillMatch</span>
        </button>

        <nav className="app-navbar-links" aria-label="Main navigation">
          {LINKS.map((link) => (
            <button
              key={link.to}
              type="button"
              className={isActive(link.match) ? "app-navbar-link active" : "app-navbar-link"}
              aria-current={isActive(link.match) ? "page" : undefined}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="app-navbar-actions">
          <NotificationBell />

          <div className="app-navbar-account" ref={menuRef}>
            <button
              type="button"
              className={onProfile ? "app-navbar-account-btn active" : "app-navbar-account-btn"}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="app-navbar-avatar">{initial}</span>
              {username && <span className="app-navbar-username">{username}</span>}
              <svg className="app-navbar-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuOpen && (
              <div className="app-navbar-menu" role="menu">
                {username && (
                  <div className="app-navbar-menu-head">
                    <span>Signed in as</span>
                    <strong>{username}</strong>
                  </div>
                )}

                <button type="button" role="menuitem" onClick={() => go("/profile")}>
                  My profile
                </button>

                <button type="button" role="menuitem" onClick={() => go("/quizzes")}>
                  Quizzes
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="app-navbar-menu-logout"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="app-navbar-mobile">
        {LINKS.map((link) => (
          <button
            key={link.to}
            type="button"
            className={isActive(link.match) ? "active" : undefined}
            onClick={() => navigate(link.to)}
          >
            {link.short}
          </button>
        ))}
      </div>
    </header>
  );
}
