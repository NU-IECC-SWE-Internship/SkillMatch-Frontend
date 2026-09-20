import { apiRequest } from "../lib/api";
import { getAccessToken } from "../lib/auth";

import type {
  Match,
  SkillItem,
} from "../types/match";

import type {
  AvailabilitySlot,
} from "./profileApi";


export type MatchRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";



export interface CreateMatchRequestPayload {
  receiver: number;
  skill: number;
  selected_slot: number;
}


// ---------------- MATCH REQUEST ----------------

export interface MatchRequest {
  id: number;

  sender: number;
  sender_username: string;

  receiver: number;
  receiver_username: string;

  skill: number;
  skill_name: string;

  selected_slot: number;

  selected_slot_day: string;

  selected_slot_start_time: string;
  selected_slot_end_time: string;

  status: MatchRequestStatus;
}


export type MatchRequestResponse =
  MatchRequest;

export type IncomingRequestItem =
  MatchRequest;



export interface UserSessionSettings {
  user: number;

  username: string;

  max_session_duration_minutes: number;

  availability: AvailabilitySlot[];
}



export async function getMatches(): Promise<
  Match[]
> {
  const token = getAccessToken();

  return apiRequest<Match[]>(
    "/api/matches/",
    {
      method: "GET",
      token,
    }
  );
}



export async function getSkillsList(): Promise<
  SkillItem[]
> {
  const token = getAccessToken();

  return apiRequest<SkillItem[]>(
    "/api/skills/",
    {
      method: "GET",
      token,
    }
  );
}



export async function createMatchRequest(
  payload: CreateMatchRequestPayload
): Promise<MatchRequestResponse> {

  const token = getAccessToken();

  return apiRequest<MatchRequestResponse>(
    "/api/requests/",
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}



export async function getIncomingRequests(): Promise<
  IncomingRequestItem[]
> {
  const token = getAccessToken();

  return apiRequest<IncomingRequestItem[]>(
    "/api/requests/incoming/",
    {
      method: "GET",
      token,
    }
  );
}



export async function respondToMatchRequest(
  requestId: number,
  action: "accept" | "reject"
): Promise<{
  message: string;
  status: MatchRequestStatus;
}> {

  const token = getAccessToken();

  return apiRequest<{
    message: string;
    status: MatchRequestStatus;
  }>(
    `/api/requests/${requestId}/respond/`,
    {
      method: "POST",

      body: {
        action,
      },

      token,
    }
  );
}



export async function getUserSessionSettings(
  userId: number
): Promise<UserSessionSettings> {

  const token = getAccessToken();

  return apiRequest<UserSessionSettings>(
    `/api/users/${userId}/session-settings/`,
    {
      method: "GET",
      token,
    }
  );
}
export interface CreateMatchRequestPayload {
  receiver: number;
  skill: number;
  selected_slot: number;

  requested_start_time: string;
  requested_end_time: string;
}