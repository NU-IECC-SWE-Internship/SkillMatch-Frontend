import { getAccessToken, refreshAccessToken, clearTokens } from '../lib/auth';

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface Meeting {
  id: number;
  request_id?: number;
  sender_id?: number;
  receiver_id?: number;
  sender_username?: string;
  receiver_username?: string;
  participant_a_name: string;
  participant_b_name: string;
  partner_name?: string;
  is_requester?: boolean;
  skill_name?: string;
  status: MeetingStatus | string;
  start_time: string;
  end_time: string;
  start_time_ts: number;
  end_time_ts: number;
  room_url: string;
  room_name?: string;
  my_token: string | null;
  created_at?: string;
}

export interface CreateMeetingPayload {
  request_id: number;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  '';

/**
 * Helper to make meeting requests with authorization and token refresh support.
 */
async function meetingFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  let token = getAccessToken();

  let res = await fetch(fullUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  // If 401, attempt token refresh and retry once
  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      res = await fetch(fullUrl, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      });
    } catch {
      clearTokens();
    }
  }

  return res;
}

/**
 * Fetch list of meetings, optionally filtered by status (default 'SCHEDULED').
 */
export async function getMeetings(status: string = 'SCHEDULED'): Promise<Meeting[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await meetingFetch(`/api/meetings/${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load meetings (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a single meeting by its ID.
 */
export async function getMeetingDetail(id: number): Promise<Meeting> {
  const res = await meetingFetch(`/api/meetings/${id}/`);
  if (!res.ok) {
    throw new Error(`Failed to load meeting (${res.status})`);
  }
  return res.json();
}

/**
 * Schedule / create a confirmed meeting for an accepted match request.
 */
export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  const res = await meetingFetch('/api/meetings/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create meeting (${res.status})`);
  }
  return res.json();
}

/**
 * Cancel a meeting via DELETE.
 */
export async function cancelMeeting(id: number): Promise<{ message: string }> {
  const res = await meetingFetch(`/api/meetings/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to cancel meeting (${res.status})`);
  }
  return res.json().catch(() => ({ message: 'Meeting cancelled successfully.' }));
}
