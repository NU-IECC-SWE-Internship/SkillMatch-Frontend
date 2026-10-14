import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import BrandIcon from "./BrandIcon";
import NotificationBell from "./NotificationBell";
import "./AppNavbar.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", short: "Dashboard", match: ["/dashboard"] },
  { to: "/skillbrowse", label: "Browse Skills", short: "Browse", match: ["/skillbrowse", "/matches", "/users", "/skills"] },
  { to: "/requests", label: "Requests", short: "Requests", match: ["/requests", "/my-requests"] },
  { to: "/meetings", label: "Sessions", short: "Sessions", match: ["/meetings"] },
  { to: "/profile", label: "Profile", short: "Profile", match: ["/profile"] },
];

export default function AppNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (match: string[]) => match.some((prefix) => pathname.startsWith(prefix));

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-navbar">
      <div className="app-navbar-main">
        <button type="button" className="app-navbar-brand" onClick={() => navigate("/dashboard")}>
          <BrandIcon className="app-navbar-brand-icon" />
          <span>SkillSwap</span>
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
          <button type="button" className="app-navbar-logout" onClick={handleLogout}>
            Logout
          </button>
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
