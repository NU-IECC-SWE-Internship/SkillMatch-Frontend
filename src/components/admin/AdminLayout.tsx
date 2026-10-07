import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAdminSkills } from "../../api/adminApi";
import { getMe, type Me } from "../../api/profileApi";
import { logout, setStaffUser } from "../../lib/auth";
import { cursorGlowFor } from "../../lib/cursorGlow";
import { initials } from "./adminFormat";
import { OverviewIcon, SkillsIcon, UsersIcon } from "./AdminIcons";
import { PENDING_SKILLS_CHANGED } from "./useFlash";
import smLogo from "../../assets/sm-logo.png";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: <OverviewIcon />, end: true, badge: false },
  { to: "/admin/users", label: "Users", icon: <UsersIcon />, end: false, badge: false },
  { to: "/admin/skills", label: "Skills & questions", icon: <SkillsIcon />, end: false, badge: true },
];

const handleAdminGlow = cursorGlowFor(".fx-glow, .admin-panel, .admin-stat-card");

interface AdminLayoutProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, subtitle, actions, children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingSkills, setPendingSkills] = useState(0);

  useEffect(() => {
    if (!me) return;
    function refresh() {
      getAdminSkills("pending")
        .then((skills) => setPendingSkills(skills.length))
        .catch(() => setPendingSkills(0));
    }
    refresh();
    window.addEventListener(PENDING_SKILLS_CHANGED, refresh);
    return () => window.removeEventListener(PENDING_SKILLS_CHANGED, refresh);
  }, [me]);

  useEffect(() => {
    getMe()
      .then((user) => {
        setStaffUser(user.is_staff);
        if (!user.is_staff) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setMe(user);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={menuOpen ? "admin-shell menu-open" : "admin-shell"}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img className="admin-sidebar-logo" src={smLogo} alt="SkillMatch logo" />
          <div>
            <strong>SkillMatch</strong>
            <span>Admin panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "admin-sidebar-link active" : "admin-sidebar-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <span className="admin-sidebar-label">{item.label}</span>
              {item.badge && pendingSkills > 0 ? (
                <span
                  className="admin-sidebar-badge"
                  title={`${pendingSkills} skill${pendingSkills === 1 ? "" : "s"} awaiting approval`}
                >
                  {pendingSkills}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {me ? (
            <div className="admin-sidebar-user">
              <span className="admin-avatar small">{initials(me.username)}</span>
              <div>
                <strong>{me.username}</strong>
                <span>Administrator</span>
              </div>
            </div>
          ) : null}
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-sidebar-backdrop" onClick={() => setMenuOpen(false)} />

      <div className="admin-main fx-backdrop" onPointerMove={handleAdminGlow}>
        <header className="admin-topbar fx-hero">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <div className="admin-topbar-titles">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
        </header>

        <main className="admin-content">
          {me ? children : <p className="admin-skills-status">Checking permissions...</p>}
        </main>
      </div>
    </div>
  );
}
