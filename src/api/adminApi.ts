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


export type AdminPeriod = 'today' | 'week' | 'month'

export interface AdminOverview {
  period: AdminPeriod | 'all'
  since: string | null
  users: {
    total: number
    active: number
    staff: number
    onboarding: number
  }
  activity: {
    new_users: number
    signed_in: number
    skills_added: number
    meetings_booked: number
    meetings_completed: number
    quizzes: { attempts: number; passed: number; failed: number; abandoned: number }
  }
  signups: { date: string; count: number }[]
  signups_unit: 'hour' | 'day' | 'month'
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
  first_name: string
  last_name: string
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
  joined?: AdminPeriod | ''
  seen?: AdminPeriod | ''
  page?: number
}

export type SkillType = 'teach' | 'learn'

export interface AdminUserSkill {
  id: number
  skill_id: number
  name: string
  type: SkillType
  is_verified: boolean
  /** Only set for unverified teach skills. */
  quiz_attempts_left: number | null
  quiz_available_at: string | null
}

export interface AdminUserDetail extends AdminUser {
  bio: string
  quiz_max_attempts: number
  skills: AdminUserSkill[]
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
    excused: boolean
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


export async function getAdminOverview(period: AdminPeriod | '' = 'week'): Promise<AdminOverview> {
  return apiRequest<AdminOverview>(`/api/admin/overview/?period=${period || 'all'}`)
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


export type AdminUserChanges = Partial<
  Pick<
    AdminUserDetail,
    'is_active' | 'is_staff' | 'username' | 'email' | 'first_name' | 'last_name' | 'bio'
  >
>

export async function updateAdminUser(
  id: number,
  changes: AdminUserChanges,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${id}/`, {
    method: 'PATCH',
    body: changes,
  })
}


export async function addAdminUserSkill(
  userId: number,
  skillId: number,
  skillType: SkillType,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/skills/`, {
    method: 'POST',
    body: { skill_id: skillId, skill_type: skillType },
  })
}


export async function setUserSkillVerified(
  userSkillId: number,
  isVerified: boolean,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/user-skills/${userSkillId}/`, {
    method: 'PATCH',
    body: { is_verified: isVerified },
  })
}


export async function removeUserSkill(userSkillId: number): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/user-skills/${userSkillId}/`, {
    method: 'DELETE',
  })
}


export async function resetUserSkillQuiz(userSkillId: number): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/user-skills/${userSkillId}/reset-quiz/`, {
    method: 'POST',
  })
}


export async function renameSkill(id: number, name: string): Promise<AdminSkill> {
  return apiRequest<AdminSkill>(`/api/admin/skills/${id}/`, {
    method: 'PATCH',
    body: { name },
  })
}


export async function deleteSkill(id: number) {
  return apiRequest<{ id: number; status: string }>(`/api/admin/skills/${id}/`, {
    method: 'DELETE',
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
