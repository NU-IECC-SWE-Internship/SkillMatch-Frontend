import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveSkill,
  denySkill,
  getAdminSkills,
  type AdminSkill,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { formatDateTime } from "../components/admin/adminFormat";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

type Tab = "pending" | "approved";

function SkillsContent() {
  const [tab, setTab] = useState<Tab>("pending");
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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
  }, [tab]);

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

  return (
    <div className="admin-panel">
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
            {value === "pending" ? "Pending approval" : "Approved skills"}
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
          {tab === "pending" ? "No skills waiting for approval." : "No approved skills yet."}
        </p>
      ) : (
        <ul className="admin-skills-list">
          {skills.map((skill) => (
            <li key={skill.id} className="admin-skill-row">
              <div className="admin-skill-info">
                <span className="admin-skill-name">{skill.name}</span>
                <span className="admin-skill-meta">
                  Added by {skill.created_by_username ?? "system"} ·{" "}
                  {formatDateTime(skill.created_at)} · used by {skill.user_count} user
                  {skill.user_count === 1 ? "" : "s"}
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
                <Link to={`/admin/skills/${skill.id}/questions`} className="admin-secondary-btn">
                  Questions ({skill.question_count})
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminSkills() {
  return (
    <AdminLayout
      title="Skills & questions"
      subtitle="Approve custom skills and manage each skill's quiz question bank."
    >
      <SkillsContent />
    </AdminLayout>
  );
}
