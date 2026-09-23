import { apiRequest } from '../lib/api'


export interface Profile {
  id: number
  user: number
  username: string
  bio: string
  onboarding_completed: boolean
  max_session_duration_minutes: number
  rating_average?: number
  rating_count?: number
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
  is_verified: boolean
  has_quiz_attempt?: boolean
  quiz_score?: number | null
  can_take_quiz?: boolean
  quiz_available_at?: string | null
}

export interface QuizQuestion {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  order: number
}

export interface SkillQuiz {
  skill_id: number
  skill_name: string
  pass_score: number
  question_count?: number
  can_take: boolean
  has_attempt: boolean
  available_at?: string | null
  cooldown_hours?: number
  attempt: {
    score: number
    passed: boolean
    created_at: string
  } | null
  questions: QuizQuestion[]
}

export interface QuizSubmitResult {
  score: number
  total: number
  passed: boolean
  is_verified: boolean
  pass_score: number
  can_retry?: boolean
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


export async function updateMaxSessionDuration(
  duration: number,
) {
  return apiRequest<Profile>('/api/profile/', {
    method: 'PATCH',
    body: {
      max_session_duration_minutes: duration,
    },
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


// ---------------- SKILLS ----------------

export async function getSkills(): Promise<Skill[]> {
  return apiRequest<Skill[]>('/api/skills/')
}


export async function createSkill(
  name: string,
): Promise<Skill> {
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

export async function getSkillQuiz(
  skillId: number,
): Promise<SkillQuiz> {
  return apiRequest<SkillQuiz>(`/api/skills/${skillId}/quiz/`)
}

export async function startSkillQuiz(
  skillId: number,
): Promise<SkillQuiz> {
  return apiRequest<SkillQuiz>(`/api/skills/${skillId}/quiz/start/`, {
    method: 'POST',
  })
}

export async function submitSkillQuiz(
  skillId: number,
  answers: { question_id: number; selected: 'A' | 'B' | 'C' | 'D' }[],
): Promise<QuizSubmitResult> {
  return apiRequest<QuizSubmitResult>(
    `/api/skills/${skillId}/quiz/submit/`,
    {
      method: 'POST',
      body: { answers },
    },
  )
}


// ---------------- AVAILABILITY ----------------

export async function getAvailability(): Promise<
  AvailabilitySlot[]
> {
  return apiRequest<AvailabilitySlot[]>(
    '/api/availability/',
  )
}


export async function getUserAvailability(
  userId: number,
): Promise<AvailabilitySlot[]> {
  return apiRequest<AvailabilitySlot[]>(
    `/api/users/${userId}/availability/`,
  )
}


export async function addAvailability(
  day: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilitySlot> {
  return apiRequest<AvailabilitySlot>(
    '/api/availability/',
    {
      method: 'POST',
      body: {
        day,
        start_time: startTime,
        end_time: endTime,
      },
    },
  )
}


export async function updateAvailability(
  id: number,
  day: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilitySlot> {
  return apiRequest<AvailabilitySlot>(
    `/api/availability/${id}/`,
    {
      method: 'PATCH',
      body: {
        day,
        start_time: startTime,
        end_time: endTime,
      },
    },
  )
}


export async function deleteAvailability(id: number) {
  return apiRequest(`/api/availability/${id}/`, {
    method: 'DELETE',
  })
}