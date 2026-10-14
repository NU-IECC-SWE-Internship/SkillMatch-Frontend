import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addAdminUserSkill,
  getAdminSkills,
  getAdminUser,
  removeUserSkill,
  resetUserSkillQuiz,
  setUserSkillVerified,
  updateAdminUser,
  type AdminSkill,
  type AdminUserChanges,
  type AdminUserDetail as UserDetail,
  type AdminUserSkill,
  type MeetingStatus,
  type SkillType,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { formatDate, formatDateTime, initials, timeAgo } from "../components/admin/adminFormat";
import type { ConfirmOptions } from "../components/admin/ConfirmDialog";
import { useConfirm } from "../components/admin/useConfirm";
import { useFlash } from "../components/admin/useFlash";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const MEETING_BADGE: Record<MeetingStatus, string> = {
  SCHEDULED: "blue",
  COMPLETED: "green",
  MISSED: "amber",
  CANCELLED: "red",
};

const INFO_FIELDS = ["first_name", "last_name", "username", "email", "bio"] as const;
type InfoField = (typeof INFO_FIELDS)[number];

function EditInfoForm({
  user,
  busy,
  onSave,
  onCancel,
}: {
  user: UserDetail;
  busy: boolean;
  onSave: (changes: AdminUserChanges) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<InfoField, string>>(() => ({
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    bio: user.bio,
  }));

  function field(name: InfoField) {
    return {
      value: values[name],
      onChange: (e: { target: { value: string } }) =>
        setValues((prev) => ({ ...prev, [name]: e.target.value })),
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const changes: AdminUserChanges = {};
    INFO_FIELDS.forEach((name) => {
      if (values[name].trim() !== (user[name] ?? "").trim()) changes[name] = values[name];
    });
    if (Object.keys(changes).length === 0) onCancel();
    else onSave(changes);
  }

  return (
    <form className="admin-edit-form" onSubmit={handleSubmit}>
      <label>
        First name
        <input type="text" maxLength={150} {...field("first_name")} />
      </label>
      <label>
        Last name
        <input type="text" maxLength={150} {...field("last_name")} />
      </label>
      <label>
        Username
        <input type="text" required maxLength={150} {...field("username")} />
      </label>
      <label>
        Email
        <input type="email" maxLength={254} {...field("email")} />
      </label>
      <label className="full">
        Bio
        <textarea rows={3} {...field("bio")} />
      </label>
      <div className="admin-edit-actions">
        <button type="button" className="admin-secondary-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="admin-approve-btn" disabled={busy}>
          {busy ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function AddSkillForm({
  user,
  busy,
  onAdd,
}: {
  user: UserDetail;
  busy: boolean;
  onAdd: (skillId: number, type: SkillType) => Promise<boolean>;
}) {
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [skillId, setSkillId] = useState("");
  const [type, setType] = useState<SkillType>("teach");

  useEffect(() => {
    getAdminSkills("approved")
      .then((list) => setSkills([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setSkills([]));
  }, []);

  const taken = new Set(user.skills.filter((s) => s.type === type).map((s) => s.skill_id));
  const available = skills.filter((skill) => !taken.has(skill.id));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!skillId) return;
    if (await onAdd(Number(skillId), type)) setSkillId("");
  }

  return (
    <form className="admin-add-skill" onSubmit={handleSubmit}>
      <select
        className="admin-select"
        value={skillId}
        onChange={(e) => setSkillId(e.target.value)}
        aria-label="Skill to add"
      >
        <option value="">Add a skill…</option>
        {available.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </select>
      <select
        className="admin-select"
        value={type}
        onChange={(e) => setType(e.target.value as SkillType)}
        aria-label="Skill type"
      >
        <option value="teach">Teaches</option>
        <option value="learn">Wants to learn</option>
      </select>
      <button type="submit" className="admin-approve-btn" disabled={busy || !skillId}>
        Add skill
      </button>
    </form>
  );
}

function quizStatus(skill: AdminUserSkill, max: number) {
  if (skill.quiz_attempts_left === null) return null;
  if (skill.quiz_attempts_left > 0) {
    return `${skill.quiz_attempts_left}/${max} quiz attempts left this week`;
  }
  return skill.quiz_available_at
    ? `No quiz attempts left · next one frees up ${formatDateTime(skill.quiz_available_at)}`
    : "No quiz attempts left";
}

function UserDetailContent({
  user,
  onChange,
}: {
  user: UserDetail;
  onChange: (user: UserDetail) => void;
}) {
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useFlash();

  const name = user.full_name || user.username;

  async function run(
    action: () => Promise<UserDetail>,
    doneText: string,
    confirmOptions?: ConfirmOptions,
  ) {
    if (confirmOptions && !(await confirm(confirmOptions))) return false;
    try {
      setBusy(true);
      setError(null);
      onChange(await action());
      setMessage(doneText);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function apply(
    changes: AdminUserChanges,
    confirmOptions: ConfirmOptions,
    doneText: string,
  ) {
    return run(() => updateAdminUser(user.id, changes), doneText, confirmOptions);
  }

  async function saveInfo(changes: AdminUserChanges) {
    if (await run(() => updateAdminUser(user.id, changes), "Profile updated.")) setEditing(false);
  }

  function toggleVerified(skill: AdminUserSkill) {
    return skill.is_verified
      ? run(() => setUserSkillVerified(skill.id, false), `${skill.name} is no longer verified.`, {
          title: `Remove the verified badge from ${skill.name}?`,
          message: `${name} will need to pass the quiz again to get it back.`,
          confirmLabel: "Unverify",
          danger: true,
        })
      : run(() => setUserSkillVerified(skill.id, true), `${skill.name} marked as verified.`, {
          title: `Verify ${name} for ${skill.name}?`,
          message: "The Verified badge will show on their profile without them taking the quiz.",
          confirmLabel: "Verify skill",
        });
  }

  function resetQuiz(skill: AdminUserSkill) {
    return run(() => resetUserSkillQuiz(skill.id), `Quiz attempts reset for ${skill.name}.`, {
      title: `Reset ${skill.name} quiz attempts?`,
      message: `${name} gets all ${user.quiz_max_attempts} attempts back right away. Past attempts stay in the history.`,
      confirmLabel: "Reset attempts",
    });
  }

  function removeSkill(skill: AdminUserSkill) {
    return run(() => removeUserSkill(skill.id), `${skill.name} removed from the profile.`, {
      title: `Remove ${skill.name} from ${name}?`,
      message: `It will no longer appear as a skill they ${skill.type === "teach" ? "teach" : "want to learn"}.`,
      confirmLabel: "Remove skill",
      danger: true,
    });
  }

  function skillRows(type: SkillType) {
    const list = user.skills.filter((s) => s.type === type);
    if (!list.length) {
      return (
        <p className="admin-empty">
          {type === "teach" ? "No teaching skills." : "No learning skills."}
        </p>
      );
    }
    return (
      <ul className="admin-list">
        {list.map((skill) => {
          const status = quizStatus(skill, user.quiz_max_attempts);
          return (
            <li key={skill.id} className="admin-list-item">
              <div className="admin-list-main">
                <strong>
                  {skill.name}
                  {skill.is_verified ? (
                    <span className="admin-badge green admin-name-badge">✓ Verified</span>
                  ) : null}
                </strong>
                {status ? <span>{status}</span> : null}
              </div>
              <div className="admin-row-actions">
                {type === "teach" ? (
                  <button
                    type="button"
                    className="admin-secondary-btn admin-small-btn"
                    disabled={busy}
                    onClick={() => toggleVerified(skill)}
                  >
                    {skill.is_verified ? "Unverify" : "Verify"}
                  </button>
                ) : null}
                {skill.quiz_attempts_left !== null &&
                skill.quiz_attempts_left < user.quiz_max_attempts ? (
                  <button
                    type="button"
                    className="admin-secondary-btn admin-small-btn"
                    disabled={busy}
                    onClick={() => resetQuiz(skill)}
                  >
                    Reset attempts
                  </button>
                ) : null}
                <button
                  type="button"
                  className="admin-deny-btn admin-small-btn"
                  disabled={busy}
                  onClick={() => removeSkill(skill)}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      {dialog}
      <Link to="/admin/users" className="admin-back-link">
        &larr; All users
      </Link>

      {message ? <p className="admin-skills-message">{message}</p> : null}
      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="admin-panel">
        <div className="admin-profile-head">
          <span className="admin-avatar large">{initials(name)}</span>
          <div>
            <h2>{name}</h2>
            <div className="admin-profile-meta">
              <span>@{user.username}</span>
              {user.email ? <span>{user.email}</span> : null}
              <span>Joined {formatDate(user.date_joined)}</span>
              <span>Last login {timeAgo(user.last_login)}</span>
            </div>
            <div className="admin-profile-badges">
              {user.is_superuser ? (
                <span className="admin-badge purple">Superuser</span>
              ) : user.is_staff ? (
                <span className="admin-badge purple">Admin</span>
              ) : (
                <span className="admin-badge">Member</span>
              )}
              {user.is_active ? (
                <span className="admin-badge green">Active</span>
              ) : (
                <span className="admin-badge red">Deactivated</span>
              )}
              {!user.is_staff && !user.onboarding_completed ? (
                <span className="admin-badge amber">Onboarding not finished</span>
              ) : null}
              {user.rating_count ? (
                <span className="admin-badge blue">
                  ★ {user.rating_average.toFixed(1)} from {user.rating_count} review
                  {user.rating_count === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="admin-profile-actions">
            {!editing ? (
              <button
                type="button"
                className="admin-secondary-btn"
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                Edit info
              </button>
            ) : null}
            {user.is_active ? (
              <button
                type="button"
                className="admin-deny-btn"
                disabled={busy}
                onClick={() =>
                  apply(
                    { is_active: false },
                    {
                      title: `Deactivate ${name}?`,
                      message: "They won't be able to sign in until you reactivate the account. Their data is kept.",
                      confirmLabel: "Deactivate account",
                      danger: true,
                    },
                    "Account deactivated.",
                  )
                }
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                className="admin-approve-btn"
                disabled={busy}
                onClick={() =>
                  apply(
                    { is_active: true },
                    {
                      title: `Reactivate ${name}?`,
                      message: "They will be able to sign in again.",
                      confirmLabel: "Reactivate",
                    },
                    "Account reactivated.",
                  )
                }
              >
                Reactivate
              </button>
            )}
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={busy}
              onClick={() =>
                user.is_staff
                  ? apply(
                      { is_staff: false },
                      {
                        title: `Remove admin access from ${name}?`,
                        message: "They will lose access to this admin panel.",
                        confirmLabel: "Remove admin",
                        danger: true,
                      },
                      "Admin access removed.",
                    )
                  : apply(
                      { is_staff: true },
                      {
                        title: `Make ${name} an admin?`,
                        message: "They will be able to manage users, approve skills and edit quiz questions.",
                        confirmLabel: "Make admin",
                      },
                      "User is now an admin.",
                    )
              }
            >
              {user.is_staff ? "Remove admin" : "Make admin"}
            </button>
          </div>
        </div>

        {editing ? (
          <EditInfoForm
            user={user}
            busy={busy}
            onSave={saveInfo}
            onCancel={() => setEditing(false)}
          />
        ) : user.bio ? (
          <p className="admin-profile-bio">{user.bio}</p>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <h2>Skills</h2>
        </div>
        <h3 className="admin-subheading">Teaches</h3>
        {skillRows("teach")}
        <h3 className="admin-subheading">Wants to learn</h3>
        {skillRows("learn")}
        <AddSkillForm
          user={user}
          busy={busy}
          onAdd={(skillId, type) =>
            run(() => addAdminUserSkill(user.id, skillId, type), "Skill added.")
          }
        />
      </section>

      <div className="admin-grid-2">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent quiz attempts</h2>
          </div>
          {user.quiz_attempts.length ? (
            <ul className="admin-list">
              {user.quiz_attempts.map((attempt) => (
                <li key={attempt.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>
                      {attempt.skill} · {attempt.score} correct
                    </strong>
                    <span>
                      {formatDateTime(attempt.created_at)}
                      {attempt.excused ? " · reset by admin" : ""}
                    </span>
                  </div>
                  {attempt.passed ? (
                    <span className="admin-badge green">passed</span>
                  ) : attempt.abandoned ? (
                    <span className="admin-badge amber">left early</span>
                  ) : (
                    <span className="admin-badge red">failed</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No quiz attempts yet.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent meetings</h2>
          </div>
          {user.meetings.length ? (
            <ul className="admin-list">
              {user.meetings.map((meeting) => (
                <li key={meeting.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>
                      {meeting.skill} with {meeting.partner}
                    </strong>
                    <span>{formatDateTime(meeting.start_time)}</span>
                  </div>
                  <span className={`admin-badge ${MEETING_BADGE[meeting.status]}`}>
                    {meeting.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No meetings yet.</p>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <h2>Reviews received</h2>
        </div>
        {user.reviews.length ? (
          <ul className="admin-list">
            {user.reviews.map((review) => (
              <li key={review.id} className="admin-list-item">
                <div className="admin-list-main">
                  <strong>
                    {"★".repeat(review.score)}
                    <span className="admin-muted">{"★".repeat(5 - review.score)}</span>{" "}
                    · {review.reviewer}
                  </strong>
                  <span>{review.feedback || "No written feedback."}</span>
                </div>
                <span className="admin-muted">{formatDate(review.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">No reviews yet.</p>
        )}
      </section>
    </>
  );
}

function UserDetailLoader({ userId }: { userId: number }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminUser(userId)
      .then(setUser)
      .catch((err) => setError(getErrorMessage(err)));
  }, [userId]);

  if (error) {
    return (
      <p className="admin-skills-error" role="alert">
        {error}
      </p>
    );
  }
  if (!user) return <p className="admin-skills-status">Loading user...</p>;
  return <UserDetailContent user={user} onChange={setUser} />;
}

export default function AdminUserDetail() {
  const userId = Number(useParams().userId);
  return (
    <AdminLayout title="User details" subtitle="Profile, skills, activity and account controls.">
      <UserDetailLoader key={userId} userId={userId} />
    </AdminLayout>
  );
}
