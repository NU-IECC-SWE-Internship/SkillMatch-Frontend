import { apiRequest } from '../lib/api'


export interface AdminSkill {
  id: number
  name: string
  is_approved: boolean
  created_by_username: string | null
  created_at: string | null
  user_count: number
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
