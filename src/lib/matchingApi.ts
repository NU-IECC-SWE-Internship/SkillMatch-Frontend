import { apiRequest } from "./api";
import { getAccessToken } from "./auth";
import type { Match } from "../types/match";



export async function getMatches(): Promise<Match[]> {
  const token = getAccessToken();

  return apiRequest<Match[]>("/api/matches/", {
    method: "GET",
    token,
  });
}