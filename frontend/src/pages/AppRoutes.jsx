import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import SchoolLayout from '../components/school/SchoolLayout';
import LoginPage from '../features/auth/LoginPage';
import AttendancePage from '../features/school/AttendancePage';
import ClassesPage from '../features/school/ClassesPage';
import DashboardPage from '../features/school/DashboardPage';
import EnrollmentsPage from '../features/school/EnrollmentsPage';
import GradesPage from '../features/school/GradesPage';
import TeachersPage from '../features/school/TeachersPage';
import DirectorDashboard from '../features/director/DirectorDashboard';
import PublicEnrollmentPage from '../features/enrollment/PublicEnrollmentPage';
import PublicHomePage from '../features/enrollment/PublicHomePage';
import SecretariatDashboard from '../features/secretariat/SecretariatDashboard';
import TeacherDashboard from '../features/teacher/TeacherDashboard';

function RequireRole({ allowed, children }) {
  const { user } = useOutletContext();
  return allowed.includes(user.role) ? children : <Navigate to="/app" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/matricula" element={<PublicEnrollmentPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<SchoolLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="matriculas" element={<RequireRole allowed={['secretaria', 'director']}><EnrollmentsPage /></RequireRole>} />
        <Route path="notas" element={<RequireRole allowed={['profesor', 'director']}><GradesPage /></RequireRole>} />
        <Route path="asistencias" element={<AttendancePage />} />
        <Route path="clases" element={<ClassesPage />} />
        <Route path="docentes" element={<TeachersPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="/secretaria" element={<SecretariatDashboard />} />
      <Route path="/director" element={<DirectorDashboard />} />
      <Route path="/profesor" element={<TeacherDashboard />} />
      <Route path="/matriculas" element={<Navigate to="/app/matriculas" replace />} />
      <Route path="/notas" element={<Navigate to="/app/notas" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
