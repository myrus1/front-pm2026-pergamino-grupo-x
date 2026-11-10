import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { HOME_BY_ROLE } from './auth/homeByRole'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage, UnauthorizedPage } from './pages/PublicPages'
import { RegisterPage } from './pages/RegisterPage'
import { AdminAdministratorsPage } from './pages/admin/AdminAdministratorsPage'
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage'
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage'
import { AdminInstructorsPage } from './pages/admin/AdminInstructorsPage'
import { AdminRevenuePage } from './pages/admin/AdminRevenuePage'
import { CourseFormPage } from './pages/instructor/CourseFormPage'
import { CourseStudentsPage } from './pages/instructor/CourseStudentsPage'
import { InstructorCoursesPage } from './pages/instructor/InstructorCoursesPage'
import { InstructorRequestsPage } from './pages/instructor/InstructorRequestsPage'
import { InstructorRevenuePage } from './pages/instructor/InstructorRevenuePage'
import { CatalogPage } from './pages/student/CatalogPage'
import { CourseDetailPage } from './pages/student/CourseDetailPage'
import { MyCoursesPage } from './pages/student/MyCoursesPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomeRedirect />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="unauthorized" element={<UnauthorizedPage />} />

              <Route element={<ProtectedRoute roles={['STUDENT']} />}>
                <Route path="student/catalog" element={<CatalogPage />} />
                <Route path="student/courses/:id" element={<CourseDetailPage />} />
                <Route path="student/my-courses" element={<MyCoursesPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['INSTRUCTOR']} />}>
                <Route path="instructor/courses" element={<InstructorCoursesPage />} />
                <Route path="instructor/courses/new" element={<CourseFormPage />} />
                <Route path="instructor/courses/:id/edit" element={<CourseFormPage />} />
                <Route path="instructor/courses/:id/students" element={<CourseStudentsPage />} />
                <Route path="instructor/requests" element={<InstructorRequestsPage />} />
                <Route path="instructor/revenue" element={<InstructorRevenuePage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                <Route path="admin/requests" element={<AdminApprovalsPage />} />
                <Route path="admin/courses" element={<AdminCoursesPage />} />
                <Route path="admin/instructors" element={<AdminInstructorsPage />} />
                <Route path="admin/administrators" element={<AdminAdministratorsPage />} />
                <Route path="admin/revenue" element={<AdminRevenuePage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
