import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAdminUsers, type AdminUserFilters, type AdminUserPage } from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { formatDate, initials, timeAgo } from "../components/admin/adminFormat";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

type Role = NonNullable<AdminUserFilters["role"]>;
type Status = NonNullable<AdminUserFilters["status"]>;

function UsersContent() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get("search") ?? "";
  const role = (params.get("role") ?? "") as Role;
  const status = (params.get("status") ?? "") as Status;
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const queryKey = params.toString();

  const [searchInput, setSearchInput] = useState(search);
  const [result, setResult] = useState<{ key: string; data: AdminUserPage } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateParams(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (searchInput.trim()) next.set("search", searchInput.trim());
      else next.delete("search");
      next.delete("page");
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, params, setParams]);

  useEffect(() => {
    let cancelled = false;
    getAdminUsers({ search, role, status, page })
      .then((data) => {
        if (cancelled) return;
        setError(null);
        setResult({ key: queryKey, data });
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [search, role, status, page, queryKey]);

  const data = result?.data;
  const loading = result?.key !== queryKey && !error;
  const totalPages = data ? Math.max(Math.ceil(data.count / data.page_size), 1) : 1;
  const firstRow = data && data.count ? (data.page - 1) * data.page_size + 1 : 0;
  const lastRow = data ? Math.min(data.page * data.page_size, data.count) : 0;

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search by name, username or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="admin-select"
          value={role}
          onChange={(e) => updateParams({ role: e.target.value })}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="member">Members</option>
          <option value="staff">Admins</option>
        </select>
        <select
          className="admin-select"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      {!data ? (
        loading ? <p className="admin-skills-status">Loading users...</p> : null
      ) : data.results.length === 0 ? (
        <p className="admin-empty">No users match these filters.</p>
      ) : (
        <div className="admin-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Skills</th>
                <th>Rating</th>
                <th>Joined</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((user) => {
                const name = user.full_name || user.username;
                return (
                  <tr key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-avatar">{initials(name)}</span>
                        <div>
                          <strong>{name}</strong>
                          <span>{user.email || `@${user.username}`}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.is_staff ? (
                        <span className="admin-badge purple">Admin</span>
                      ) : (
                        <span className="admin-badge">Member</span>
                      )}
                    </td>
                    <td>
                      {!user.is_active ? (
                        <span className="admin-badge red">Deactivated</span>
                      ) : user.onboarding_completed || user.is_staff ? (
                        <span className="admin-badge green">Active</span>
                      ) : (
                        <span className="admin-badge amber">Onboarding</span>
                      )}
                    </td>
                    <td className="admin-muted">
                      {user.teach_count} teach · {user.learn_count} learn
                      {user.verified_count ? (
                        <>
                          {" "}
                          <span className="admin-badge green">{user.verified_count} verified</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {user.rating_count ? (
                        <>
                          ★ {user.rating_average.toFixed(1)}{" "}
                          <span className="admin-muted">({user.rating_count})</span>
                        </>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                    <td className="admin-muted">{formatDate(user.date_joined)}</td>
                    <td className="admin-muted">{timeAgo(user.last_login)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.count > 0 ? (
        <div className="admin-pagination">
          <span>
            Showing {firstRow}–{lastRow} of {data.count}
          </span>
          <div>
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </button>
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function AdminUsers() {
  return (
    <AdminLayout title="Users" subtitle="Browse, search and manage every SkillMatch account.">
      <UsersContent />
    </AdminLayout>
  );
}
