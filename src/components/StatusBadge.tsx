import type { ApprovalStatus, CourseStatus } from '../types/domain'
import { APPROVAL_STATUS_LABELS, COURSE_STATUS_LABELS } from '../utils/labels'

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return <span className={`badge badge--course-${status.toLowerCase()}`}>{COURSE_STATUS_LABELS[status]}</span>
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <span className={`badge badge--approval-${status.toLowerCase()}`}>{APPROVAL_STATUS_LABELS[status]}</span>
}
