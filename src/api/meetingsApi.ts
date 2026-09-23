import { getAccessToken, refreshAccessToken, clearTokens } from '../lib/auth';

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface ReviewItem {
  id: number;
  score: number | null;
  feedback: string;
  is_revealed: boolean;
  created_at: string;
}

export interface Meeting {
  id: number;
  request_id?: number;
  sender_id?: number;
  receiver_id?: number;
  sender_username?: string;
  receiver_username?: string;
  participant_a_name: string;
  participant_b_name: string;
  partner_id?: number;
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
  has_user_rated?: boolean;
  has_partner_rated?: boolean;
  is_revealed?: boolean;
  review_deadline_ts?: number;
  can_review?: boolean;
  user_review?: ReviewItem | null;
  partner_review?: ReviewItem | null;
}

export interface CreateMeetingPayload {
  request_id: number;
  timezone?: string;
}

export interface RateMeetingResponse {
  message: string;
  is_revealed: boolean;
  meeting: Meeting;
}

export interface MeetingReviewsResponse {
  meeting_id: number;
  is_revealed: boolean;
  review_deadline_ts: number;
  ratings: {
    id: number;
    meeting_id: number;
    reviewer_id: number;
    reviewer_username: string;
    reviewed_user_id: number;
    reviewed_username: string;
    score: number | null;
    feedback: string;
    is_revealed: boolean;
    revealed_at?: string | null;
    created_at: string;
  }[];
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
 * Fetch list of meetings, optionally filtered by status (default 'all' to get all sessions).
 */
export async function getMeetings(status: string = 'all'): Promise<Meeting[]> {
  const query = status && status.toLowerCase() !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
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

/**
 * Submit a post-meeting rating (1-5 stars with optional feedback).
 */
export async function submitMeetingRating(
  meetingId: number,
  score: number,
  feedback?: string
): Promise<RateMeetingResponse> {
  const res = await meetingFetch(`/api/meetings/${meetingId}/reviews/`, {
    method: 'POST',
    body: JSON.stringify({ score, feedback: feedback || '' }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to submit review (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch reviews for a specific meeting.
 */
export async function getMeetingReviews(meetingId: number): Promise<MeetingReviewsResponse> {
  const res = await meetingFetch(`/api/meetings/${meetingId}/reviews/`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch meeting reviews (${res.status})`);
  }
  return res.json();
}
