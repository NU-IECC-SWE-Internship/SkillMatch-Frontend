import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAdminUsers,
  type AdminUserPage,
  type AdminUserRole,
  type AdminUserSort,
  type AdminUserStatus,
} from "../api/adminApi";
import AdminLayout from "../components/admin/AdminLayout";
import { ChevronRightIcon, SearchIcon } from "../components/admin/AdminIcons";
import { formatDate, formatDateTime, initials, timeAgo } from "../components/admin/adminFormat";
import UserStatusBadge from "../components/admin/UserStatusBadge";
import { getErrorMessage } from "../lib/api";
import "./AdminSkills.css";

const STATUS_TABS: { value: AdminUserStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "onboarding", label: "Onboarding" },
  { value: "inactive", label: "Deactivated" },
];

const SORT_OPTIONS: { value: AdminUserSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "last_login", label: "Recently signed in" },
  { value: "rating", label: "Highest rated" },
];

function UsersContent() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get("search") ?? "";
  const role = (params.get("role") ?? "") as AdminUserRole | "";
  const status = (params.get("status") ?? "") as AdminUserStatus | "";
  const sort = (params.get("sort") ?? "newest") as AdminUserSort;
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

  function clearFilters() {
    setSearchInput("");
    setParams(new URLSearchParams(), { replace: true });
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
    getAdminUsers({ search, role, status, sort, page })
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
  }, [search, role, status, sort, page, queryKey]);

  const data = result?.data;
  const loading = result?.key !== queryKey && !error;
  const totalPages = data ? Math.max(Math.ceil(data.count / data.page_size), 1) : 1;
  const firstRow = data && data.count ? (data.page - 1) * data.page_size + 1 : 0;
  const lastRow = data ? Math.min(data.page * data.page_size, data.count) : 0;
  const hasFilters = Boolean(search || role || status || sort !== "newest");

  function tabCount(value: AdminUserStatus | "") {
    if (!data) return "…";
    return value ? data.counts.status[value] : data.counts.all;
  }

  function openUser(id: number) {
    navigate(`/admin/users/${id}`);
  }

  return (
    <section className="admin-panel">
      <div className="admin-skills-tabs" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            className={status === tab.value ? "admin-tab active" : "admin-tab"}
            onClick={() => updateParams({ status: tab.value })}
          >
            {tab.label}
            <span
              className={
                tab.value === "onboarding" && data && data.counts.status.onboarding > 0
                  ? "admin-tab-count alert"
                  : "admin-tab-count"
              }
            >
              {tabCount(tab.value)}
            </span>
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-field">
          <SearchIcon />
          <input
            type="search"
            className="admin-search"
            placeholder="Search by name, username or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="admin-select"
          value={role}
          onChange={(e) => updateParams({ role: e.target.value })}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="member">Members{data ? ` (${data.counts.role.member})` : ""}</option>
          <option value="staff">Admins{data ? ` (${data.counts.role.staff})` : ""}</option>
        </select>
        <select
          className="admin-select"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value === "newest" ? "" : e.target.value })}
          aria-label="Sort users"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <button type="button" className="admin-text-btn" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="admin-skills-error" role="alert">
          {error}
        </p>
      ) : null}

      {!data ? (
        loading ? <p className="admin-skills-status">Loading users...</p> : null
      ) : data.results.length === 0 ? (
        <div className="admin-empty-state">
          <strong>No users found</strong>
          <p>Try a different search or filter.</p>
          {hasFilters ? (
            <button type="button" className="admin-secondary-btn admin-empty-action" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
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
                <th>Last sign-in</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {data.results.map((user) => {
                const name = user.full_name || user.username;
                return (
                  <tr
                    key={user.id}
                    tabIndex={0}
                    onClick={() => openUser(user.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openUser(user.id);
                    }}
                    className={user.is_active ? undefined : "admin-row-muted"}
                  >
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
                      {user.is_superuser ? (
                        <span className="admin-badge purple">Superuser</span>
                      ) : user.is_staff ? (
                        <span className="admin-badge purple">Admin</span>
                      ) : (
                        <span className="admin-badge">Member</span>
                      )}
                    </td>
                    <td>
                      <UserStatusBadge
                        isActive={user.is_active}
                        isStaff={user.is_staff}
                        onboardingCompleted={user.onboarding_completed}
                      />
                    </td>
                    <td>
                      {user.teach_count + user.learn_count === 0 ? (
                        <span className="admin-muted">—</span>
                      ) : (
                        <div className="admin-skill-counts">
                          <span title="Skills they can teach">
                            <strong>{user.teach_count}</strong> teach
                          </span>
                          <span title="Skills they want to learn">
                            <strong>{user.learn_count}</strong> learn
                          </span>
                          {user.verified_count ? (
                            <span className="admin-badge green" title="Teaching skills verified by quiz">
                              ✓ {user.verified_count}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td>
                      {user.rating_count ? (
                        <span className="admin-rating">
                          <span className="admin-rating-star">★</span>
                          {user.rating_average.toFixed(1)}
                          <span className="admin-muted">({user.rating_count})</span>
                        </span>
                      ) : (
                        <span className="admin-muted">No reviews</span>
                      )}
                    </td>
                    <td className="admin-muted" title={formatDateTime(user.date_joined)}>
                      {formatDate(user.date_joined)}
                    </td>
                    <td className="admin-muted" title={user.last_login ? formatDateTime(user.last_login) : undefined}>
                      {timeAgo(user.last_login)}
                    </td>
                    <td className="admin-row-chevron">
                      <ChevronRightIcon />
                    </td>
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
            Showing <strong>{firstRow}–{lastRow}</strong> of <strong>{data.count}</strong>
          </span>
          <div>
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              &larr; Previous
            </button>
            <span className="admin-page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="admin-secondary-btn"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next &rarr;
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
