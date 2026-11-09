import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';
import { FormSelect } from '../../components/school/SchoolForm';

const attendanceStates = [
  { value: 'presente', label: 'Presente' },
  { value: 'tardanza', label: 'Tardanza' },
  { value: 'falta', label: 'Falta' },
  { value: 'justificada', label: 'Justificada' },
];

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function AttendancePage() {
  const { user } = useOutletContext();
  const [roster, setRoster] = useState([]);
  const [section, setSection] = useState('');
  const [date, setDate] = useState(localDate());
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRoster() {
      try {
        setLoading(true);
        setError('');
        const response = user.role === 'profesor'
          ? await api.get('/grades')
          : await api.get('/enrollments');
        const data = Array.isArray(response.data) ? response.data : [];
        const unique = new Map();
        data.forEach((item) => {
          const student = item.student || item;
          const id = item.student_id || student.id;
          if (id && !unique.has(id)) {
            unique.set(id, {
              id,
              name: student.full_name || item.student_name || [student.names, student.surnames].filter(Boolean).join(' ') || 'Estudiante',
              dni: student.dni || item.student_dni || '',
              grade: item.grade_level || student.grade_level || '',
              section: item.section || '',
            });
          }
        });
        if (active) setRoster([...unique.values()]);
      } catch (loadError) {
        if (active) setError(loadError.message || 'No se pudo cargar la lista de estudiantes.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRoster();
    return () => { active = false; };
  }, [user.role]);

  const sections = useMemo(() => [...new Set(roster.map((student) => `${student.grade} · ${student.section}`).filter((value) => value !== ' · '))].sort(), [roster]);
  const visibleStudents = roster.filter((student) => !section || `${student.grade} · ${student.section}` === section);

  function updateState(studentId, value) {
    setDraft((current) => ({ ...current, [studentId]: value }));
    setIsPreview(true);
  }

  return (
    <div className="school-page">
      <header className="school-page-heading">
        <div><span className="school-eyebrow">SEGUIMIENTO DIARIO</span><h2>Control de asistencias</h2><p>Selecciona una sección y fecha para preparar el registro del aula.</p></div>
      </header>
      {error && <div className="school-alert school-alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
      <div className="school-api-notice">
        <Activity size={19} />
        <div><strong>Interfaz preparada · guardado aún no disponible</strong><span>El backend actual no expone endpoints para consultar matrículas académicas ni registrar asistencias. Los cambios de esta vista son solo una previsualización y no se guardan.</span></div>
      </div>
      <section className="school-panel">
        <div className="school-filter-row">
          <label className="school-field"><span>Sección</span><FormSelect value={section} onChange={(event) => setSection(event.target.value)} placeholder="Todas las secciones" options={sections.map((value) => ({ value, label: value }))} /></label>
          <label className="school-field"><span>Fecha</span><span className="school-date-input"><CalendarDays size={16} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></span></label>
          <div className="school-filter-summary"><strong>{visibleStudents.length}</strong><span>estudiantes</span></div>
        </div>
        <div className="school-attendance-list">
          {loading ? <p className="school-empty-state">Cargando estudiantes…</p> : visibleStudents.length === 0 ? (
            <p className="school-empty-state">No hay alumnos disponibles para esta sección.</p>
          ) : visibleStudents.map((student) => (
            <article key={student.id} className="school-attendance-row">
              <span className="school-student-avatar">{student.name.slice(0, 1)}</span>
              <span className="school-attendance-student"><strong>{student.name}</strong><small>{student.dni ? `DNI ${student.dni}` : 'DNI no disponible'}</small></span>
              <span className="school-attendance-section">{student.grade} · {student.section}</span>
              <label className="school-field school-attendance-select"><span className="sr-only">Estado de asistencia de {student.name}</span>
                <FormSelect value={draft[student.id] || ''} placeholder="Marcar asistencia" onChange={(event) => updateState(student.id, event.target.value)} options={attendanceStates} />
              </label>
            </article>
          ))}
        </div>
        <footer className="school-attendance-footer">
          <span>{isPreview && <><CheckCircle2 size={15} /> Selección local lista; todavía no está guardada</>}</span>
          <button type="button" className="school-button school-button--primary" disabled title="El API Go aún no ofrece el endpoint de asistencia">Guardar asistencia</button>
        </footer>
      </section>
    </div>
  );
}
