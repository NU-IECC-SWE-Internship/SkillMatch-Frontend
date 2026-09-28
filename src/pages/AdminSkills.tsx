import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveSkill,
  denySkill,
  getAdminSkills,
  type AdminSkill,
} from "../api/adminApi";
import { getErrorMessage } from "../lib/api";
import { loadStaffRole, logout } from "../lib/auth";
import "./Dashboard.css";
import "./AdminSkills.css";

type Tab = "pending" | "approved";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function AdminSkills() {
  const navigate = useNavigate();

  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStaffRole()
      .then((staff) => {
        setIsStaff(staff);
        if (!staff) navigate("/dashboard", { replace: true });
      })
      .catch(() => setIsStaff(false));
  }, [navigate]);

  useEffect(() => {
    if (!isStaff) return;

    let cancelled = false;

    getAdminSkills(tab)
      .then((data) => {
        if (!cancelled) setSkills(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isStaff, tab]);

  async function handleApprove(skill: AdminSkill) {
    try {
      setBusyId(skill.id);
      setError(null);
      await approveSkill(skill.id);
      setSkills((prev) => prev.filter((item) => item.id !== skill.id));
      setMessage(`"${skill.name}" approved.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(skill: AdminSkill) {
    const confirmed = window.confirm(
      `Deny "${skill.name}"? It will be removed from ${skill.user_count} user profile(s).`,
    );
    if (!confirmed) return;

    try {
      setBusyId(skill.id);
      setError(null);
      await denySkill(skill.id);
      setSkills((prev) => prev.filter((item) => item.id !== skill.id));
      setMessage(`"${skill.name}" denied and removed.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <h2>SkillMatch Admin</h2>
        </div>

        <div className="dashboard-user-menu">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content admin-skills">
        <div className="welcome-banner">
          <h1>Skill approvals</h1>
          <p className="welcome-description">
            Custom skills added by users stay hidden from matching until you
            approve them. Denying a skill removes it from the catalog.
          </p>
        </div>

        {isStaff === null ? (
          <p className="admin-skills-status">Checking permissions...</p>
        ) : !isStaff ? (
          <div className="admin-skills-card admin-skills-denied" role="alert">
            <p>You need an admin account to view this page.</p>
          </div>
        ) : (
          <div className="admin-skills-card">
            <div className="admin-skills-tabs" role="tablist">
              {(["pending", "approved"] as Tab[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={tab === value ? "admin-tab active" : "admin-tab"}
                  onClick={() => {
                    if (value === tab) return;
                    setTab(value);
                    setLoading(true);
                    setError(null);
                    setMessage(null);
                  }}
                >
                  {value === "pending" ? "Pending" : "Approved"}
                </button>
              ))}
            </div>

            {message ? <p className="admin-skills-message">{message}</p> : null}
            {error ? (
              <p className="admin-skills-error" role="alert">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="admin-skills-status">Loading skills...</p>
            ) : skills.length === 0 ? (
              <p className="admin-skills-status">
                {tab === "pending"
                  ? "No skills waiting for approval."
                  : "No approved skills yet."}
              </p>
            ) : (
              <ul className="admin-skills-list">
                {skills.map((skill) => (
                  <li key={skill.id} className="admin-skill-row">
                    <div className="admin-skill-info">
                      <span className="admin-skill-name">{skill.name}</span>
                      <span className="admin-skill-meta">
                        Added by {skill.created_by_username ?? "system"} ·{" "}
                        {formatDate(skill.created_at)} · used by{" "}
                        {skill.user_count} user{skill.user_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    {tab === "pending" ? (
                      <div className="admin-skill-actions">
                        <button
                          type="button"
                          className="admin-approve-btn"
                          disabled={busyId === skill.id}
                          onClick={() => handleApprove(skill)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-deny-btn"
                          disabled={busyId === skill.id}
                          onClick={() => handleDeny(skill)}
                        >
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span className="admin-skill-approved">Approved</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
