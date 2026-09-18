import { apiRequest } from '../lib/api';

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
 * Fetch list of meetings, optionally filtered by status (default 'accepted').
 */
export async function getMeetings(status: string = 'accepted'): Promise<Meeting[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await apiRequest<Meeting[]>(`/api/meetings/${query}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a single meeting by its primary key ID.
 */
export async function getMeetingDetail(id: number): Promise<Meeting> {
  return apiRequest<Meeting>(`/api/meetings/${id}/`);
}

/**
 * Accept a pending meeting.
 */
export async function acceptMeeting(id: number): Promise<Meeting> {
  return apiRequest<Meeting>(`/api/meetings/${id}/accept/`, {
    method: 'POST',
  });
}

/**
 * Reject a pending meeting.
 */
export async function rejectMeeting(id: number): Promise<Meeting> {
  return apiRequest<Meeting>(`/api/meetings/${id}/reject/`, {
    method: 'POST',
  });
}

/**
 * Cancel a meeting.
 */
export async function cancelMeeting(id: number): Promise<Meeting> {
  return apiRequest<Meeting>(`/api/meetings/${id}/cancel/`, {
    method: 'POST',
  });
}
