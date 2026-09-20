import { apiRequest } from '../lib/api'

export interface Profile {
  id: number
  user: number
  bio: string
  onboarding_completed: boolean
}

export interface Skill {
  id: number
  name: string
}

export interface UserSkill {
  id: number
  skill: number
  skill_name: string
  skill_type: 'teach' | 'learn'
}

export interface AvailabilitySlot {
  id: number
  day: string
  start_time: string
  end_time: string
}

// ---------------- PROFILE ----------------

export async function getProfile() {
  return apiRequest<Profile>('/api/profile/')
}

export async function updateProfile(bio: string) {
  return apiRequest<Profile>('/api/profile/', {
    method: 'PATCH',
    body: { bio },
  })
}

export async function getSkills(): Promise<Skill[]> {
  return apiRequest<Skill[]>('/api/skills/')
}

export async function createSkill(name: string): Promise<Skill> {
  return apiRequest<Skill>('/api/skills/', {
    method: 'POST',
    body: { name },
  })
}

export async function getMySkills(): Promise<UserSkill[]> {
  return apiRequest<UserSkill[]>('/api/my-skills/')
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
  })
}

export async function deleteUserSkill(id: number) {
  return apiRequest(`/api/my-skills/${id}/`, {
    method: 'DELETE',
  })
}

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>('/api/availability/')
}

export async function getUserAvailability(
  userId: number,
): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(`/api/users/${userId}/availability/`)
}

export async function addAvailability(
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
  })
}

export async function updateAvailability(
  id: number,
  day: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilitySlot> {
  return apiRequest<AvailabilitySlot>(`/api/availability/${id}/`, {
    method: 'PATCH',
    body: {
      day,
      start_time: startTime,
      end_time: endTime,
    },
  })
}

export async function deleteAvailability(id: number) {
  return apiRequest(`/api/availability/${id}/`, {
    method: 'DELETE',
  })
}

export async function completeOnboarding() {
  return apiRequest<Profile>('/api/profile/', {
    method: 'PATCH',
    body: {
      onboarding_completed: true,
    },
  })
}
