import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  UsersRound,
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/school/StatusBadge';

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function DashboardPage() {
  const { user } = useOutletContext();
  const isTeacher = user.role === 'profesor';
  const canManageEnrollments = user.role === 'director' || user.role === 'secretaria';
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState({});
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const requests = [];
        if (canManageEnrollments) {
          requests.push(Promise.all([api.get('/enrollments'), api.get('/enrollments/stats')]));
        }
        if (isTeacher || user.role === 'director') requests.push(api.get('/grades'));
        const results = await Promise.all(requests);
        if (!active) return;
        let index = 0;
        if (canManageEnrollments) {
          const [listResult, statsResult] = results[index++];
          setEnrollments(listResult.data || []);
          setEnrollmentStats(statsResult.data || {});
        }
        if (isTeacher || user.role === 'director') setGrades(results[index]?.data || []);
      } catch (loadError) {
        if (active) setError(loadError.message || 'No se pudo cargar el resumen.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, [canManageEnrollments, isTeacher, user.role]);

  const recentActivity = canManageEnrollments
    ? [...enrollments]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 5)
      .map((item) => ({
        id: `enrollment-${item.id}`,
        title: item.student?.full_name || item.code,
        detail: `${item.code} · ${item.grade_level || 'Grado no indicado'}`,
        status: item.status,
        date: item.updated_at || item.created_at,
      }))
    : [...grades]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 5)
      .map((item) => ({
        id: `grade-${item.id}`,
        title: item.student_name,
        detail: `${item.subject_name} · ${item.grade_level} ${item.section}`,
        status: `v${item.current_version}`,
        date: item.updated_at || item.created_at,
      }));

  return (
    <div className="school-page">
      <section className="school-welcome">
        <div>
          <span className="school-eyebrow">PANEL INSTITUCIONAL · 2026</span>
          <h2>Buen día, {user.full_name?.split(' ')[0] || user.username}</h2>
          <p>Un resumen claro para dar seguimiento a la actividad académica del colegio.</p>
        </div>
        <span className="school-welcome-mark"><GraduationCap size={27} /></span>
      </section>

      {error && <div className="school-alert school-alert--error" role="alert">{error}</div>}

      <section className="school-kpi-grid" aria-label="Indicadores institucionales">
        {canManageEnrollments && (
          <>
            <article className="school-kpi-card">
              <span className="school-kpi-icon kpi-blue"><GraduationCap size={19} /></span>
              <div><p>Matrículas formalizadas</p><strong>{loading ? '—' : enrollmentStats.Aprobada ?? 0}</strong><small>Solicitudes aprobadas</small></div>
            </article>
            <article className="school-kpi-card">
              <span className="school-kpi-icon kpi-amber"><ClipboardList size={19} /></span>
              <div><p>En revisión</p><strong>{loading ? '—' : (enrollmentStats.Pendiente ?? 0) + (enrollmentStats.Observada ?? 0)}</strong><small>Pendientes y observadas</small></div>
            </article>
          </>
        )}
        {isTeacher && (
          <article className="school-kpi-card">
            <span className="school-kpi-icon kpi-blue"><BookOpenCheck size={19} /></span>
            <div><p>Calificaciones registradas</p><strong>{loading ? '—' : grades.length}</strong><small>Con historial de versiones</small></div>
          </article>
        )}
        <article className="school-kpi-card">
          <span className="school-kpi-icon kpi-green"><Activity size={19} /></span>
          <div><p>Asistencia de hoy</p><strong>—</strong><small>Registro aún no conectado</small></div>
        </article>
        <article className="school-kpi-card">
          <span className="school-kpi-icon kpi-purple"><CalendarDays size={19} /></span>
          <div><p>Clases programadas</p><strong>—</strong><small>Horarios aún no conectados</small></div>
        </article>
      </section>

      <section className="school-dashboard-grid">
        <article className="school-panel">
          <header className="school-panel-header">
            <div>
              <h3>Actividad reciente</h3>
              <p>{canManageEnrollments ? 'Últimas solicitudes actualizadas' : 'Últimas calificaciones modificadas'}</p>
            </div>
            <span className="school-panel-header-icon"><Activity size={18} /></span>
          </header>
          {loading ? <p className="school-empty-state">Cargando actividad…</p> : recentActivity.length === 0 ? (
            <p className="school-empty-state">No hay actividad registrada para mostrar.</p>
          ) : (
            <ul className="school-activity-list">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <span className="school-activity-dot" />
                  <div className="school-activity-content">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <div className="school-activity-meta">
                    {canManageEnrollments ? <StatusBadge status={item.status} /> : <span className="school-version-badge">{item.status}</span>}
                    <time>{formatDate(item.date)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="school-panel school-quick-links">
          <header className="school-panel-header">
            <div><h3>Accesos rápidos</h3><p>Continúa con tus tareas frecuentes</p></div>
          </header>
          {canManageEnrollments && (
            <Link to="/app/matriculas" className="school-quick-link">
              <span className="school-quick-icon kpi-blue"><GraduationCap size={18} /></span>
              <span><strong>Revisar matrículas</strong><small>Evaluar solicitudes y documentos</small></span>
              <ArrowUpRight size={17} />
            </Link>
          )}
          {(isTeacher || user.role === 'director') && (
            <Link to="/app/notas" className="school-quick-link">
              <span className="school-quick-icon kpi-green"><BookOpenCheck size={18} /></span>
              <span><strong>Gestionar notas</strong><small>Registro e historial Memento</small></span>
              <ArrowUpRight size={17} />
            </Link>
          )}
          <Link to="/app/docentes" className="school-quick-link">
            <span className="school-quick-icon kpi-purple"><UsersRound size={18} /></span>
            <span><strong>Consultar docentes</strong><small>Personal y asignaciones académicas</small></span>
            <ArrowUpRight size={17} />
          </Link>
          <div className="school-note">
            <strong>Nota de disponibilidad</strong>
            <span>Asistencias y horarios estarán habilitados cuando la API Go exponga sus operaciones.</span>
          </div>
        </article>
      </section>
    </div>
  );
}
