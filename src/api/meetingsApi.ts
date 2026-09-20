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
  timezone?: string;
}


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";


// ---------------- FETCH HELPER ----------------

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


  // Access token expired
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


// ---------------- GET MEETINGS ----------------

export async function getMeetings(
  status: string = "SCHEDULED"
): Promise<Meeting[]> {
  const query =
    status
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


// ---------------- MEETING DETAIL ----------------

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


// ---------------- CREATE MEETING ----------------

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


// ---------------- CANCEL MEETING ----------------

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