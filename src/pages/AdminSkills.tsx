import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  approveSkill,
  deleteSkill,
  denySkill,
  getAdminSkills,
  renameSkill,
  type AdminSkill,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { SearchIcon } from "../components/admin/AdminIcons";
import {
  PERIOD_OPTIONS,
  formatDateTime,
  periodStart,
  timeAgo,
  type Period,
} from "../components/admin/adminFormat";
import { useConfirm } from "../components/admin/useConfirm";
import { notifyPendingSkillsChanged, useFlash } from "../components/admin/useFlash";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

type Tab = "pending" | "approved";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function SkillsContent() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<AdminSkill[]>([]);
  const [approved, setApproved] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState<Period | "">("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useFlash();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAdminSkills("pending"), getAdminSkills("approved")])
      .then(([pendingSkills, approvedSkills]) => {
        if (cancelled) return;
        setPending(pendingSkills);
        setApproved([...approvedSkills].sort((a, b) => a.name.localeCompare(b.name)));
        // Land on the approved list when there's nothing to review.
        if (pendingSkills.length === 0) setTab("approved");
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
  }, []);

  async function handleApprove(skill: AdminSkill) {
    try {
      setBusyId(skill.id);
      setError(null);
      const updated = await approveSkill(skill.id);
      setPending((prev) => prev.filter((item) => item.id !== skill.id));
      setApproved((prev) =>
        [...prev, { ...skill, ...updated }].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setMessage(`"${skill.name}" approved. It is now visible to everyone.`);
      notifyPendingSkillsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function startRename(skill: AdminSkill) {
    setRenamingId(skill.id);
    setDraftName(skill.name);
  }

  async function handleRename(skill: AdminSkill) {
    const name = draftName.trim();
    if (!name || name === skill.name) {
      setRenamingId(null);
      return;
    }
    try {
      setBusyId(skill.id);
      setError(null);
      const updated = await renameSkill(skill.id, name);
      setApproved((prev) =>
        prev
          .map((item) => (item.id === skill.id ? { ...item, ...updated } : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setRenamingId(null);
      setMessage(`"${skill.name}" renamed to "${updated.name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(skill: AdminSkill) {
    const confirmed = await confirm({
      title: `Delete "${skill.name}"?`,
      message: (
        <>
          <p>The skill and its quiz question bank will be deleted. This can't be undone.</p>
          {skill.user_count > 0 ? (
            <p>
              It will also be removed from <strong>{plural(skill.user_count, "user profile")}</strong>,
              including any verified badges.
            </p>
          ) : null}
        </>
      ),
      confirmLabel: "Delete skill",
      danger: true,
    });
    if (!confirmed) return;

    try {
      setBusyId(skill.id);
      setError(null);
      await deleteSkill(skill.id);
      setApproved((prev) => prev.filter((item) => item.id !== skill.id));
      setMessage(`"${skill.name}" deleted.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(skill: AdminSkill) {
    const confirmed = await confirm({
      title: `Deny "${skill.name}"?`,
      message: (
        <>
          <p>The skill will be deleted.</p>
          {skill.user_count > 0 ? (
            <p>
              It will also be removed from <strong>{plural(skill.user_count, "user profile")}</strong>.
            </p>
          ) : null}
        </>
      ),
      confirmLabel: "Deny and delete",
      danger: true,
    });
    if (!confirmed) return;

    try {
      setBusyId(skill.id);
      setError(null);
      await denySkill(skill.id);
      setPending((prev) => prev.filter((item) => item.id !== skill.id));
      setMessage(`"${skill.name}" denied and removed.`);
      notifyPendingSkillsChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const addedSince = periodStart(added);
  const list = (tab === "pending" ? pending : approved).filter(
    (skill) =>
      (!query || skill.name.toLowerCase().includes(query)) &&
      (!addedSince || (skill.created_at !== null && new Date(skill.created_at) >= addedSince)),
  );
  const filtered = Boolean(query || added);

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "pending", label: "Awaiting approval", count: pending.length },
    { value: "approved", label: "Approved skills", count: approved.length },
  ];

  return (
    <section className="admin-panel">
      {dialog}

      <div className="admin-skills-tabs" role="tablist">
        {tabs.map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "admin-tab active" : "admin-tab"}
            onClick={() => setTab(value)}
          >
            {label}
            <span className={value === "pending" && count > 0 ? "admin-tab-count alert" : "admin-tab-count"}>
              {loading ? "…" : count}
            </span>
          </button>
        ))}
      </div>

      <p className="admin-tab-hint">
        {tab === "pending"
          ? "Skills that users typed in themselves. They stay hidden from everyone else until you approve them."
          : "Skills users can pick. Rename or delete a skill, or open it to manage the quiz questions used to verify teachers."}
      </p>

      <div className="admin-toolbar">
        <div className="admin-search-field">
          <SearchIcon />
          <input
            type="search"
            className="admin-search"
            placeholder="Search skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-select"
          value={added}
          onChange={(e) => setAdded(e.target.value as Period | "")}
          aria-label="Filter by date added"
        >
          <option value="">Added any time</option>
          {PERIOD_OPTIONS.filter((option) => option.value).map((option) => (
            <option key={option.value} value={option.value}>
              Added {option.label.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {message ? <p className="admin-skills-message">{message}</p> : null}
      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-skills-status">Loading skills...</p>
      ) : list.length === 0 ? (
        <div className="admin-empty-state">
          {filtered ? (
            <p>No skills match these filters.</p>
          ) : tab === "pending" ? (
            <>
              <strong>All caught up</strong>
              <p>No skills are waiting for approval.</p>
            </>
          ) : (
            <p>No approved skills yet.</p>
          )}
        </div>
      ) : tab === "pending" ? (
        <ul className="admin-skills-list">
          {list.map((skill) => (
            <li key={skill.id} className="admin-skill-row pending">
              <div className="admin-skill-info">
                <span className="admin-skill-name">{skill.name}</span>
                <span className="admin-skill-meta">
                  Requested by <strong>{skill.created_by_username ?? "unknown user"}</strong>{" "}
                  <span title={formatDateTime(skill.created_at)}>{timeAgo(skill.created_at)}</span>
                  {" · "}
                  on {plural(skill.user_count, "profile")}
                </span>
              </div>

              <div className="admin-skill-actions">
                <button
                  type="button"
                  className="admin-approve-btn"
                  disabled={busyId === skill.id}
                  onClick={() => handleApprove(skill)}
                >
                  {busyId === skill.id ? "Saving..." : "Approve"}
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
            </li>
          ))}
        </ul>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Used by</th>
                <th>Questions this month</th>
                <th>Added by</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((skill) => (
                <tr
                  key={skill.id}
                  onClick={() => {
                    if (renamingId !== skill.id) navigate(`/admin/skills/${skill.id}/questions`);
                  }}
                >
                  <td>
                    {renamingId === skill.id ? (
                      <form
                        className="admin-rename-form"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => {
                          e.preventDefault();
                          void handleRename(skill);
                        }}
                      >
                        <input
                          type="text"
                          className="admin-search"
                          value={draftName}
                          maxLength={100}
                          autoFocus
                          aria-label="New skill name"
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                        <button
                          type="submit"
                          className="admin-approve-btn admin-small-btn"
                          disabled={busyId === skill.id}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-btn admin-small-btn"
                          onClick={() => setRenamingId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <strong className="admin-skill-name">{skill.name}</strong>
                    )}
                  </td>
                  <td className="admin-muted">{plural(skill.user_count, "user")}</td>
                  <td>
                    {skill.question_count > 0 ? (
                      <span className="admin-badge blue">{skill.question_count}</span>
                    ) : (
                      <span className="admin-badge amber">None yet</span>
                    )}
                  </td>
                  <td className="admin-muted" title={formatDateTime(skill.created_at)}>
                    {skill.created_by_username ?? "System"}
                    {skill.created_at ? ` · ${timeAgo(skill.created_at)}` : ""}
                  </td>
                  <td className="admin-table-action" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-secondary-btn admin-small-btn"
                        disabled={busyId === skill.id}
                        onClick={() => startRename(skill)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="admin-deny-btn admin-small-btn"
                        disabled={busyId === skill.id}
                        onClick={() => handleDelete(skill)}
                      >
                        Delete
                      </button>
                      <Link to={`/admin/skills/${skill.id}/questions`} className="admin-panel-link">
                        Manage questions &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminSkills() {
  return (
    <AdminLayout
      title="Skills & questions"
      subtitle="Review skills users have added and manage each skill's quiz question bank."
    >
      <SkillsContent />
    </AdminLayout>
  );
}
