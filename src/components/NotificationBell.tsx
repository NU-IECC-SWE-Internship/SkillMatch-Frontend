import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationItem } from "../api/notificationApi";
import { useNotifications } from "../context/NotificationContext";
import "./NotificationBell.css";

function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 60) return "just now";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return past.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getIconForType(type: string): string {
  switch (type) {
    case "match_request":
      return "🎯";
    case "match_accepted":
      return "🎉";
    case "match_rejected":
      return "ℹ️";
    case "meeting_cancelled":
      return "⚠️";
    case "meeting_reminder":
      return "⏰";
    case "rating_prompt":
      return "⭐";
    case "partner_reviewed":
      return "📝";
    case "reviews_revealed":
      return "✨";
    case "skill_approved":
      return "🎓";
    case "skill_rejected":
      return "ℹ️";
    case "chat_message":
      return "💬";
    case "return_session_proposed":
      return "📅";
    case "return_session_confirmed":
      return "🤝";
    case "return_session_declined":
      return "🔄";
    case "skill_verified":
      return "🌟";
    case "welcome":
      return "👋";
    default:
      return "🔔";
  }
}

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    pushSupported,
    pushSubscribed,
    enablePushNotifications,
    emailNotifications,
    emailNotificationsLoading,
    toggleEmailNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEnablingPush, setIsEnablingPush] = useState<boolean>(false);
  const [emailFeedback, setEmailFeedback] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    setIsOpen(false);

    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleEnablePush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEnablingPush(true);
    try {
      const res = await enablePushNotifications();
      if (!res.success && res.error) {
        alert(res.error);
      }
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleToggleEmail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const success = await toggleEmailNotifications();
    if (success) {
      setEmailFeedback(
        !emailNotifications
          ? "Email notifications turned on"
          : "Email notifications paused"
      );
      setTimeout(() => setEmailFeedback(""), 3500);
    } else {
      setEmailFeedback("Failed to update setting");
      setTimeout(() => setEmailFeedback(""), 3500);
    }
  };

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button
        type="button"
        className={`notification-bell-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <svg
          className="bell-icon"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {pushSupported && !pushSubscribed && (
            <div className="push-prompt-banner">
              <div className="push-prompt-content">
                <span className="push-prompt-icon">🔔</span>
                <div className="push-prompt-text-group">
                  <span className="push-prompt-title">Desktop & device alerts </span>
                  <span className="push-prompt-subtitle">
                    Get notified even when away from the tab
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="push-prompt-btn"
                onClick={handleEnablePush}
                disabled={isEnablingPush}
              >
                {isEnablingPush ? "Enabling..." : "Enable"}
              </button>
            </div>
          )}

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notification-item ${!item.is_read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <span className="notification-item-icon">
                    {getIconForType(item.notification_type)}
                  </span>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{item.title}</div>
                    {item.message && (
                      <div className="notification-item-message">
                        {item.message}
                      </div>
                    )}
                    <div className="notification-item-time">
                      {formatRelativeTime(item.created_at)}
                    </div>
                  </div>
                  {!item.is_read && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown-footer">
            <div className="notification-pref-item">
              <div className="notification-pref-info">
                <span className="notification-pref-icon">✉️</span>
                <div className="notification-pref-text">
                  <span className="notification-pref-title">Email Notifications</span>
                  <span className="notification-pref-desc">
                    Get emails for match requests & updates
                  </span>
                </div>
              </div>
              <label className="notification-switch" title="Toggle email notifications">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  disabled={emailNotificationsLoading}
                  onChange={handleToggleEmail}
                />
                <span className="notification-switch-slider" />
              </label>
            </div>
            {emailFeedback && (
              <div className="notification-pref-feedback">{emailFeedback}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
