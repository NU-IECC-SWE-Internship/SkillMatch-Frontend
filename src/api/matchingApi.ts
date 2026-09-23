import { apiRequest } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import type { Match, SkillItem } from "../types/match";

export type MatchRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface CreateMatchRequestPayload {
  receiver: number;
  skill: number;
  selected_slot: number;
}

export interface MatchRequest {
  id: number;
  sender: number;
  sender_username: string;
  sender_rating_average?: number;
  sender_rating_count?: number;
  receiver: number;
  receiver_username: string;
  receiver_rating_average?: number;
  receiver_rating_count?: number;
  skill: number;
  skill_name: string;
  selected_slot: number;
  selected_slot_day: string;
  selected_slot_start_time: string;
  selected_slot_end_time: string;
  status: MatchRequestStatus;
  rejection_reason: string | null;
}

export type MatchRequestResponse = MatchRequest;
export type IncomingRequestItem = MatchRequest;

export async function getMatches(): Promise<Match[]> {
  const token = getAccessToken();

  return apiRequest<Match[]>("/api/matches/", {
    method: "GET",
    token,
  });
}

export async function getSkillsList(): Promise<SkillItem[]> {
  const token = getAccessToken();
  return apiRequest<SkillItem[]>("/api/skills/", {
    method: "GET",
    token,
  });
}

export async function createMatchRequest(
  payload: CreateMatchRequestPayload
): Promise<MatchRequestResponse> {
  const token = getAccessToken();
  return apiRequest<MatchRequestResponse>("/api/requests/", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function getIncomingRequests(): Promise<IncomingRequestItem[]> {
  const token = getAccessToken();
  return apiRequest<IncomingRequestItem[]>("/api/requests/incoming/", {
    method: "GET",
    token,
  });
}

export async function respondToMatchRequest(
  requestId: number,
  action: "accept" | "reject",
  rejectionReason?: string,
  timezone?: string
): Promise<{
  message: string;
  status: MatchRequestStatus;
  rejection_reason?: string;
  meeting_id?: number;
}> {
  const token = getAccessToken();

  return apiRequest(
    `/api/requests/${requestId}/respond/`,
    {
      method: "POST",
      body: {
        action,
        ...(action === "reject"
          ? { rejection_reason: rejectionReason }
          : { timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone }),
      },
      token,
    }
  );
}

export async function getSentRequests(): Promise<MatchRequest[]> {
  const token = getAccessToken();

  return apiRequest<MatchRequest[]>("/api/requests/sent/", {
    method: "GET",
    token,
  });
}