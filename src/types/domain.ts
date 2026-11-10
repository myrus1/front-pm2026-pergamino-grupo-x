export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export type CourseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED'

export type ApprovalStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface SessionUser {
  id: number
  role: Role
  firstName: string
  lastName: string
  email: string
}

export interface AuthSession {
  token: string
  user: SessionUser
}

export interface Specialty {
  id: number
  name: string
}

export interface Course {
  id: number
  title: string
  description: string | null
  basePrice: number
  startDate: string
  endDate: string
  maxCapacity: number
  status: CourseStatus
  specialtyId: number | null
  instructorId: number | null
}

export interface CoursePayload {
  title: string
  description: string | null
  basePrice: number
  startDate: string
  endDate: string
  maxCapacity: number
  specialtyId: number
  instructorId: number
}

export interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  dni: string
}

export interface StudentPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  dni: string
}

export interface Instructor {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface InstructorPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface Administrator {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface AdministratorPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface Enrollment {
  id: number
  enrollmentDate: string
  finalAmount: number
  studentId: number
  courseId: number
}

export interface ApprovalRequest {
  id: number
  courseId: number
  status: ApprovalStatus
  requestDate: string
  resolutionDate: string | null
  instructorComment: string | null
  administratorComment: string | null
  administratorId: number | null
}

export interface Revenue {
  total: number
}
