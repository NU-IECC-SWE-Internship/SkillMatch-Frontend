import {
  getAccessToken,
  refreshAccessToken,
  clearTokens,
} from "../lib/auth";


export type MeetingStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "MISSED"
  | "CANCELLED";


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

  participant_a_id?: number;
  participant_b_id?: number;

  participant_a_name: string;
  participant_b_name: string;

  // Added by the rating / meeting updates from main
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

  // Rating / review information
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
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";


// ========================================================
// FETCH HELPER
// ========================================================

async function meetingFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const fullUrl =
    url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url}`;

  let token =
    getAccessToken();


  let response = await fetch(
    fullUrl,
    {
      ...init,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(init.headers || {}),
      },
    }
  );


  // Access token expired -> refresh and retry once
  if (response.status === 401) {
    try {
      token =
        await refreshAccessToken();

      response = await fetch(
        fullUrl,
        {
          ...init,

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),

            ...(init.headers || {}),
          },
        }
      );

    } catch {
      clearTokens();
    }
  }


  return response;
}


// ========================================================
// GET MEETINGS
// ========================================================

export async function getMeetings(
  status: string = "all"
): Promise<Meeting[]> {

  const query =
    status &&
    status.toLowerCase() !== "all"
      ? `?status=${encodeURIComponent(status)}`
      : "";


  const response =
    await meetingFetch(
      `/api/meetings/${query}`
    );


  if (!response.ok) {
    throw new Error(
      `Failed to load meetings (${response.status})`
    );
  }


  const data =
    await response.json();


  return Array.isArray(data)
    ? data
    : [];
}


// ========================================================
// GET MEETING DETAIL
// ========================================================

export async function getMeetingDetail(
  id: number
): Promise<Meeting> {

  const response =
    await meetingFetch(
      `/api/meetings/${id}/`
    );


  if (!response.ok) {
    throw new Error(
      `Failed to load meeting (${response.status})`
    );
  }


  return response.json();
}


// ========================================================
// CREATE MEETING
// ========================================================

export async function createMeeting(
  payload: CreateMeetingPayload
): Promise<Meeting> {

  const response =
    await meetingFetch(
      "/api/meetings/",
      {
        method: "POST",

        body: JSON.stringify(
          payload
        ),
      }
    );


  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(
      errorData.error ||
        `Failed to create meeting (${response.status})`
    );
  }


  return response.json();
}


// ========================================================
// CANCEL MEETING
// ========================================================

export async function cancelMeeting(
  id: number
): Promise<{
  message: string;
}> {

  const response =
    await meetingFetch(
      `/api/meetings/${id}/`,
      {
        method: "DELETE",
      }
    );


  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(
      errorData.error ||
        `Failed to cancel meeting (${response.status})`
    );
  }


  return response
    .json()
    .catch(() => ({
      message:
        "Meeting cancelled successfully.",
    }));
}


// ========================================================
// SUBMIT MEETING RATING
// ========================================================

export async function submitMeetingRating(
  meetingId: number,
  score: number,
  feedback?: string
): Promise<RateMeetingResponse> {

  const response =
    await meetingFetch(
      `/api/meetings/${meetingId}/reviews/`,
      {
        method: "POST",

        body: JSON.stringify({
          score,
          feedback:
            feedback || "",
        }),
      }
    );


  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(
      errorData.error ||
        `Failed to submit review (${response.status})`
    );
  }


  return response.json();
}


// ========================================================
// GET MEETING REVIEWS
// ========================================================

export async function getMeetingReviews(
  meetingId: number
): Promise<MeetingReviewsResponse> {

  const response =
    await meetingFetch(
      `/api/meetings/${meetingId}/reviews/`
    );


  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => ({}));


    throw new Error(
      errorData.error ||
        `Failed to fetch meeting reviews (${response.status})`
    );
  }


  return response.json();
}