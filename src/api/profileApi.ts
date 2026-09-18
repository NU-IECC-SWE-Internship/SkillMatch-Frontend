import { getAccessToken } from "../lib/auth";

const API_URL = "http://127.0.0.1:8000/api";


export interface Skill {
  id: number;
  name: string;
}

export interface UserSkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: "teach" | "learn";
}

export interface AvailabilitySlot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
}


// ---------------- AUTH HEADERS ----------------

function getAuthHeaders() {
  const token = getAccessToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// ---------------- PROFILE ----------------

export async function getProfile() {
  const response = await fetch(
    `${API_URL}/profile/`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
}


export async function updateProfile(bio: string) {
  const response = await fetch(
    `${API_URL}/profile/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),

      body: JSON.stringify({
        bio,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
}



export async function getSkills(): Promise<Skill[]> {
  const response = await fetch(
    `${API_URL}/skills/`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load skills");
  }

  return response.json();
}


export async function createSkill(
  name: string
): Promise<Skill> {

  const response = await fetch(
    `${API_URL}/skills/`,
    {
      method: "POST",
      headers: getAuthHeaders(),

      body: JSON.stringify({
        name,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create skill");
  }

  return response.json();
}


export async function getMySkills(): Promise<UserSkill[]> {
  const response = await fetch(
    `${API_URL}/my-skills/`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load user skills");
  }

  return response.json();
}


export async function addUserSkill(
  skill: number,
  skillType: "teach" | "learn"
): Promise<UserSkill> {

  const response = await fetch(
    `${API_URL}/my-skills/`,
    {
      method: "POST",
      headers: getAuthHeaders(),

      body: JSON.stringify({
        skill,
        skill_type: skillType,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add user skill");
  }

  return response.json();
}


export async function deleteUserSkill(id: number) {
  const response = await fetch(
    `${API_URL}/my-skills/${id}/`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete user skill");
  }
}



export async function getAvailability(): Promise<
  AvailabilitySlot[]
> {

  const response = await fetch(
    `${API_URL}/availability/`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load availability");
  }

  return response.json();
}


export async function addAvailability(
  day: string,
  startTime: string,
  endTime: string
): Promise<AvailabilitySlot> {

  const response = await fetch(
    `${API_URL}/availability/`,
    {
      method: "POST",
      headers: getAuthHeaders(),

      body: JSON.stringify({
        day,
        start_time: startTime,
        end_time: endTime,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add availability");
  }

  return response.json();
}


export async function updateAvailability(
  id: number,
  day: string,
  startTime: string,
  endTime: string
): Promise<AvailabilitySlot> {

  const response = await fetch(
    `${API_URL}/availability/${id}/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),

      body: JSON.stringify({
        day,
        start_time: startTime,
        end_time: endTime,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update availability");
  }

  return response.json();
}


export async function deleteAvailability(id: number) {
  const response = await fetch(
    `${API_URL}/availability/${id}/`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete availability");
  }
}

export async function completeOnboarding() {
  const response = await fetch("http://127.0.0.1:8000/api/profile/", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      onboarding_completed: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not complete onboarding");
  }

  return response.json();
}