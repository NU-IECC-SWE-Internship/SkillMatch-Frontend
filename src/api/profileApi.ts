import { apiRequest } from '../lib/api';

export interface Skill {
  id: number;
  name: string;
}

export interface UserSkill {
  id: number;
  skill: number;
  skill_name: string;
  skill_type: 'teach' | 'learn';
}

export interface AvailabilitySlot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
}

export interface UserProfile {
  id: number;
  bio: string;
  user?: unknown;
  onboarding_completed?: boolean;
}

// ---------------- PROFILE ----------------

export async function getProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/profile/');
}

export async function updateProfile(bio: string) {
  return apiRequest<{ id: number; bio: string }>('/api/profile/', {
    method: 'PATCH',
    body: { bio },
  });
}

// ---------------- SKILLS ----------------

export async function getSkills(): Promise<Skill[]> {
  const data = await apiRequest<Skill[]>('/api/skills/');
  return Array.isArray(data) ? data : [];
}

export async function createSkill(name: string): Promise<Skill> {
  return apiRequest<Skill>('/api/skills/', {
    method: 'POST',
    body: { name },
  });
}

export async function getMySkills(): Promise<UserSkill[]> {
  const data = await apiRequest<UserSkill[]>('/api/my-skills/');
  return Array.isArray(data) ? data : [];
}

export async function addUserSkill(
  skill: number,
  skillType: 'teach' | 'learn',
): Promise<UserSkill> {
  return apiRequest<UserSkill>('/api/my-skills/', {
    method: 'POST',
    body: {
      skill,
      skill_type: skillType,
    },
  });
}

export async function deleteUserSkill(id: number): Promise<void> {
  await apiRequest<void>(`/api/my-skills/${id}/`, {
    method: 'DELETE',
  });
}

// ---------------- AVAILABILITY ----------------

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const data = await apiRequest<AvailabilitySlot[]>('/api/availability/');
  return Array.isArray(data) ? data : [];
}

export async function createAvailability(
  day: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilitySlot> {
  return apiRequest<AvailabilitySlot>('/api/availability/', {
    method: 'POST',
    body: {
      day,
      start_time: startTime,
      end_time: endTime,
    },
  });
}

export const addAvailability = createAvailability;


export async function updateAvailability(
  id: number,
  day: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilitySlot> {
  return apiRequest<AvailabilitySlot>(`/api/availability/${id}/`, {
    method: 'PUT',
    body: {
      day,
      start_time: startTime,
      end_time: endTime,
    },
  });
}

export async function deleteAvailability(id: number): Promise<void> {
  await apiRequest<void>(`/api/availability/${id}/`, {
    method: 'DELETE',
  });
}

export async function completeOnboarding() {
  return apiRequest('/api/profile/', {
    method: 'PATCH',
    body: {
      onboarding_completed: true,
    },
  });
}