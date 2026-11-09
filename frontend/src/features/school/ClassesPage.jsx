import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3 } from 'lucide-react';
import api from '../../api/client';
import { FormSelect } from '../../components/school/SchoolForm';

const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const periods = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];

export default function ClassesPage() {
  const [assignments, setAssignments] = useState([]);
  const [section, setSection] = useState('');
  const [teacher, setTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/academic/assignments')
      .then((response) => { if (active) setAssignments(Array.isArray(response.data) ? response.data : []); })
      .catch((loadError) => { if (active) setError(loadError.message || 'No se pudieron cargar las asignaciones.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const sections = useMemo(() => [...new Set(assignments.map((item) => `${item.grade_level} · ${item.section}`))].sort(), [assignments]);
  const teachers = useMemo(() => [...new Set(assignments.map((item) => item.teacher_name).filter(Boolean))].sort(), [assignments]);
  const filtered = assignments.filter((item) => (
    (!section || `${item.grade_level} · ${item.section}` === section)
    && (!teacher || item.teacher_name === teacher)
  ));

  return (
    <div className="school-page">
      <header className="school-page-heading">
        <div><span className="school-eyebrow">ORGANIZACIÓN ESCOLAR</span><h2>Clases y horarios</h2><p>Consulta asignaciones por sección y docente en una vista semanal.</p></div>
      </header>
      {error && <div className="school-alert school-alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
      <div className="school-api-notice">
        <CalendarDays size={19} />
        <div><strong>El calendario está listo para conectarse</strong><span>La API actual devuelve docentes, cursos y secciones asignados, pero no ofrece día, hora ni aula del horario. No se muestran bloques inventados.</span></div>
      </div>
      <section className="school-panel">
        <div className="school-filter-row">
          <label className="school-field"><span>Sección</span><FormSelect value={section} onChange={(event) => setSection(event.target.value)} placeholder="Todas las secciones" options={sections.map((value) => ({ value, label: value }))} /></label>
          <label className="school-field"><span>Docente</span><FormSelect value={teacher} onChange={(event) => setTeacher(event.target.value)} placeholder="Todos los docentes" options={teachers.map((value) => ({ value, label: value }))} /></label>
          <div className="school-filter-summary"><strong>{filtered.length}</strong><span>asignaciones</span></div>
        </div>
        <div className="school-week-grid">
          {weekdays.map((day) => (
            <section className="school-week-day" key={day}>
              <h3>{day}</h3>
              {periods.map((time) => (
                <div key={time} className="school-week-slot"><span>{time}</span><small>Sin horario registrado</small></div>
              ))}
            </section>
          ))}
        </div>
      </section>
      <section className="school-panel">
        <header className="school-panel-header"><div><h3>Asignaciones sin horario</h3><p>Relaciones académicas disponibles en el sistema</p></div><Clock3 size={19} /></header>
        {loading ? <p className="school-empty-state">Cargando asignaciones…</p> : filtered.length === 0 ? (
          <p className="school-empty-state">No hay asignaciones para los filtros seleccionados.</p>
        ) : (
          <div className="school-assignment-grid">
            {filtered.map((item) => (
              <article className="school-assignment-card" key={item.id}>
                <span className="school-assignment-icon"><CalendarDays size={17} /></span>
                <div><strong>{item.subject_name}</strong><span>{item.grade_level} · Sección {item.section}</span><small>{item.teacher_name}</small></div>
                <span className="school-badge badge-pending">Horario pendiente</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
