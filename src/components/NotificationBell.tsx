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

type IconName = "inbox" | "calendar" | "star" | "check" | "alert" | "chat" | "bell" | "mail";

// Simple line icons (24x24, stroked) instead of emojis.
const ICON_PATHS: Record<IconName, string> = {
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13l2.5-7h11L20 13v6H4z",
  calendar: "M5 6h14v14H5zM9 3v5M15 3v5M5 11h14",
  star: "M12 4l2.4 5 5.6.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8 9.6 9z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 4l9 16H3zM12 10v4M12 17.5v.5",
  chat: "M4 5h16v11H9l-5 4z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
};

function LineIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={ICON_PATHS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getIconForType(type: string): IconName {
  switch (type) {
    case "match_request":
      return "inbox";
    case "meeting_reminder":
    case "return_session_proposed":
      return "calendar";
    case "rating_prompt":
    case "partner_reviewed":
    case "reviews_revealed":
      return "star";
    case "match_accepted":
    case "skill_approved":
    case "skill_verified":
    case "return_session_confirmed":
      return "check";
    case "match_rejected":
    case "meeting_cancelled":
    case "skill_rejected":
    case "return_session_declined":
      return "alert";
    case "chat_message":
      return "chat";
    default:
      return "bell";
  }
}

// Older notifications were saved with emojis in their titles; hide them.
function stripEmoji(text: string): string {
  return text
    .replace(/\s*(?:\p{Extended_Pictographic}|️)+/gu, "")
    .trim();
}

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
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

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <LineIcon name="bell" />
                </div>
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
                    <LineIcon name={getIconForType(item.notification_type)} />
                  </span>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{stripEmoji(item.title)}</div>
                    {item.message && (
                      <div className="notification-item-message">
                        {stripEmoji(item.message)}
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
        </div>
      )}
    </div>
  );
}
