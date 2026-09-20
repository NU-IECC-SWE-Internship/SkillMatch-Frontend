import {
  getAccessToken,
  refreshAccessToken,
  clearTokens,
} from "../lib/auth";


export interface Meeting {
  id: number;

  participant_a_id: number;
  participant_b_id: number;

  participant_a_name: string;
  participant_b_name: string;

  partner_name?: string;

  is_requester?: boolean;

  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled";

  start_time: string;
  end_time: string;

  start_time_ts: number;
  end_time_ts: number;

  room_url: string;

  my_token: string | null;

  created_at?: string;
}



async function meetingFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {

  let token = getAccessToken();


  let response = await fetch(
    url,
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


  if (response.status === 401) {

    try {

      token =
        await refreshAccessToken();


      response = await fetch(
        url,
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



export async function getMeetings(
  status: string = "accepted"
): Promise<Meeting[]> {

  const query =
    status
      ? `?status=${encodeURIComponent(
          status
        )}`
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



export async function acceptMeeting(
  id: number
): Promise<Meeting> {

  const response =
    await meetingFetch(
      `/api/meetings/${id}/accept/`,
      {
        method: "POST",
      }
    );


  if (!response.ok) {

    throw new Error(
      `Failed to accept meeting (${response.status})`
    );
  }


  return response.json();
}



export async function rejectMeeting(
  id: number
): Promise<Meeting> {

  const response =
    await meetingFetch(
      `/api/meetings/${id}/reject/`,
      {
        method: "POST",
      }
    );


  if (!response.ok) {

    throw new Error(
      `Failed to reject meeting (${response.status})`
    );
  }


  return response.json();
}



export async function cancelMeeting(
  id: number
): Promise<Meeting> {

  const response =
    await meetingFetch(
      `/api/meetings/${id}/cancel/`,
      {
        method: "POST",
      }
    );


  if (!response.ok) {

    throw new Error(
      `Failed to cancel meeting (${response.status})`
    );
  }


  return response.json();
}