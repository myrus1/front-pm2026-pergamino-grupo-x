import type { ApprovalRequest, ApprovalStatus } from '../types/domain'
import { apiFetch, toQuery } from './client'

export interface ApprovalFilters {
  status?: ApprovalStatus
  instructorId?: number
}

export function getApprovalRequests(filters: ApprovalFilters = {}): Promise<ApprovalRequest[]> {
  const query = toQuery({ status: filters.status, instructorId: filters.instructorId })
  return apiFetch<ApprovalRequest[]>(`/approval-requests${query}`)
}

export function submitApprovalRequest(courseId: number, instructorComment: string): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>('/approval-requests', {
    method: 'POST',
    body: { courseId, instructorComment: instructorComment || null },
  })
}

export function approveApprovalRequest(
  id: number,
  administratorId: number,
  administratorComment: string,
): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>(`/approval-requests/${id}/approve`, {
    method: 'POST',
    body: { administratorId, administratorComment: administratorComment || null },
  })
}

export function rejectApprovalRequest(
  id: number,
  administratorId: number,
  administratorComment: string,
): Promise<ApprovalRequest> {
  return apiFetch<ApprovalRequest>(`/approval-requests/${id}/reject`, {
    method: 'POST',
    body: { administratorId, administratorComment: administratorComment || null },
  })
}
