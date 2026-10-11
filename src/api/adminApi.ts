import { apiRequest } from '../lib/api'


export interface AdminSkill {
  id: number
  name: string
  is_approved: boolean
  created_by_username: string | null
  created_at: string | null
  user_count: number
  question_count: number
}


export type CorrectOption = 'A' | 'B' | 'C' | 'D'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuizQuestionInput {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: CorrectOption
  difficulty: Difficulty
}

export interface AdminQuizQuestion extends QuizQuestionInput {
  id: number
  cycle: string
  created_at: string
}

export interface QuestionBank {
  skill_id: number
  skill_name: string
  cycle: string
  bank_size: number
  current_count: number
  difficulty_counts: Record<Difficulty, number>
  difficulty_targets: Record<Difficulty, number>
  questions: AdminQuizQuestion[]
}


export async function getAdminSkills(
  status: 'pending' | 'approved' = 'pending',
): Promise<AdminSkill[]> {
  return apiRequest<AdminSkill[]>(`/api/admin/skills/?status=${status}`)
}


export async function approveSkill(id: number): Promise<AdminSkill> {
  return apiRequest<AdminSkill>(`/api/admin/skills/${id}/approve/`, {
    method: 'POST',
  })
}


export async function denySkill(id: number) {
  return apiRequest<{ id: number; status: string }>(
    `/api/admin/skills/${id}/deny/`,
    { method: 'POST' },
  )
}


export async function getQuestionBank(skillId: number): Promise<QuestionBank> {
  return apiRequest<QuestionBank>(`/api/admin/skills/${skillId}/questions/`)
}


export async function createQuestion(
  skillId: number,
  input: QuizQuestionInput,
): Promise<AdminQuizQuestion> {
  return apiRequest<AdminQuizQuestion>(`/api/admin/skills/${skillId}/questions/`, {
    method: 'POST',
    body: input,
  })
}


export async function updateQuestion(
  id: number,
  input: QuizQuestionInput,
): Promise<AdminQuizQuestion> {
  return apiRequest<AdminQuizQuestion>(`/api/admin/questions/${id}/`, {
    method: 'PATCH',
    body: input,
  })
}


export async function deleteQuestion(id: number) {
  return apiRequest(`/api/admin/questions/${id}/`, { method: 'DELETE' })
}


export interface AdminOverview {
  users: {
    total: number
    active: number
    staff: number
    new_this_week: number
    logged_in_this_week: number
    onboarding: number
  }
  signups: { date: string; count: number }[]
  skills: { approved: number; pending: number; verified_teachers: number }
  top_skills: {
    id: number
    name: string
    teachers: number
    learners: number
    verified: number
  }[]
  requests: Partial<Record<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED', number>>
  meetings: Partial<Record<MeetingStatus, number>>
  quizzes_this_week: { attempts: number; passed: number; failed: number; abandoned: number }
  recent_users: {
    id: number
    username: string
    name: string
    date_joined: string
    is_staff: boolean
    is_active: boolean
    onboarding_completed: boolean
  }[]
}

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'

export interface AdminUser {
  id: number
  username: string
  email: string
  full_name: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  date_joined: string
  last_login: string | null
  onboarding_completed: boolean
  rating_average: number
  rating_count: number
  teach_count: number
  learn_count: number
  verified_count: number
}

export type AdminUserRole = 'staff' | 'member'
export type AdminUserStatus = 'active' | 'onboarding' | 'inactive'
export type AdminUserSort = 'newest' | 'oldest' | 'name' | 'last_login' | 'rating'

export interface AdminUserPage {
  count: number
  page: number
  page_size: number
  counts: {
    all: number
    role: Record<AdminUserRole, number>
    status: Record<AdminUserStatus, number>
  }
  results: AdminUser[]
}

export interface AdminUserFilters {
  search?: string
  role?: AdminUserRole | ''
  status?: AdminUserStatus | ''
  sort?: AdminUserSort | ''
  page?: number
}

export interface AdminUserDetail extends AdminUser {
  bio: string
  skills: {
    id: number
    skill_id: number
    name: string
    type: 'teach' | 'learn'
    is_verified: boolean
  }[]
  stats: {
    requests_sent: number
    requests_received: number
    meetings: Partial<Record<MeetingStatus, number>>
    quiz_attempts: number
  }
  quiz_attempts: {
    id: number
    skill: string
    score: number
    passed: boolean
    abandoned: boolean
    created_at: string
  }[]
  meetings: {
    id: number
    partner: string
    skill: string
    start_time: string
    status: MeetingStatus
  }[]
  reviews: {
    id: number
    reviewer: string
    score: number
    feedback: string
    created_at: string
  }[]
}


export async function getAdminOverview(): Promise<AdminOverview> {
  return apiRequest<AdminOverview>('/api/admin/overview/')
}


export async function getAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUserPage> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const query = params.toString()
  return apiRequest<AdminUserPage>(`/api/admin/users/${query ? `?${query}` : ''}`)
}


export async function getAdminUser(id: number): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${id}/`)
}


export async function updateAdminUser(
  id: number,
  changes: Partial<Pick<AdminUser, 'is_active' | 'is_staff'>>,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${id}/`, {
    method: 'PATCH',
    body: changes,
  })
}


export async function generateQuestions(
  skillId: number,
): Promise<QuestionBank & { added: number }> {
  return apiRequest<QuestionBank & { added: number }>(
    `/api/admin/skills/${skillId}/questions/generate/`,
    { method: 'POST' },
  )
}
