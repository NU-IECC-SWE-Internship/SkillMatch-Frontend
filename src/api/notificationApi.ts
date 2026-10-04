import { apiRequest } from "../lib/api";
import { getAccessToken } from "../lib/auth";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type:
    | "match_request"
    | "match_accepted"
    | "match_rejected"
    | "meeting_cancelled"
    | "general";
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  unread_count: number;
  notifications: NotificationItem[];
}

export async function getNotifications(): Promise<NotificationResponse> {
  const token = getAccessToken();
  return apiRequest<NotificationResponse>("/api/notifications/", {
    method: "GET",
    token,
  });
}

export async function markNotificationAsRead(
  id: number
): Promise<{ success: boolean }> {
  const token = getAccessToken();
  return apiRequest<{ success: boolean }>(`/api/notifications/${id}/read/`, {
    method: "POST",
    token,
  });
}

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
}> {
  const token = getAccessToken();
  return apiRequest<{ success: boolean }>("/api/notifications/mark-all-read/", {
    method: "POST",
    token,
  });
}
