import { getAccessToken, refreshAccessToken, clearTokens } from '../lib/auth';

export interface Meeting {
  id: number;
  participant_a_id: number;
  participant_b_id: number;
  participant_a_name: string;
  participant_b_name: string;
  partner_name?: string;
  is_requester?: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  start_time: string;
  end_time: string;
  start_time_ts: number;
  end_time_ts: number;
  room_url: string;
  my_token: string | null;
  created_at?: string;
}

/**
 * Helper to make meeting requests with authorization and token refresh support.
 */
async function meetingFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  let res = await fetch(url, {
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
      res = await fetch(url, {
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
 * Fetch list of meetings, optionally filtered by status (default 'accepted').
 */
export async function getMeetings(status: string = 'accepted'): Promise<Meeting[]> {
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
 * Accept a pending meeting.
 */
export async function acceptMeeting(id: number): Promise<Meeting> {
  const res = await meetingFetch(`/api/meetings/${id}/accept/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to accept meeting (${res.status})`);
  }
  return res.json();
}

/**
 * Reject a pending meeting.
 */
export async function rejectMeeting(id: number): Promise<Meeting> {
  const res = await meetingFetch(`/api/meetings/${id}/reject/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to reject meeting (${res.status})`);
  }
  return res.json();
}

/**
 * Cancel a meeting.
 */
export async function cancelMeeting(id: number): Promise<Meeting> {
  const res = await meetingFetch(`/api/meetings/${id}/cancel/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to cancel meeting (${res.status})`);
  }
  return res.json();
}
