import { apiRequest } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import type { Match } from "../types/match";



export async function getMatches(): Promise<Match[]> {
  const token = getAccessToken();

  return apiRequest<Match[]>("/api/matches/", {
    method: "GET",
    token,
  });
}