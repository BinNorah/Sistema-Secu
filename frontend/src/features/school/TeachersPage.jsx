import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search, UsersRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';
import SchoolTable from '../../components/school/SchoolTable';

export default function TeachersPage() {
  const { user } = useOutletContext();
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadTeachers() {
      try {
        setLoading(true);
        setError('');
        const requests = [api.get('/academic/assignments')];
        if (user.role === 'director') requests.push(api.get('/director/users?role=profesor'));
        const results = await Promise.all(requests);
        if (!active) return;
        const assignmentList = Array.isArray(results[0].data) ? results[0].data : [];
        setAssignments(assignmentList);
        if (user.role === 'director') {
          setTeachers(Array.isArray(results[1].data) ? results[1].data : []);
        } else {
          const seen = new Map();
          assignmentList.forEach((item) => {
            if (!seen.has(item.teacher_id)) {
              seen.set(item.teacher_id, { id: item.teacher_id, full_name: item.teacher_name, role: 'profesor' });
            }
          });
          setTeachers([...seen.values()]);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'No se pudieron cargar los docentes.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTeachers();
    return () => { active = false; };
  }, [user.role]);

  const visibleTeachers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return teachers.filter((teacher) => (
      !query || [teacher.full_name, teacher.username, teacher.email]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query))
    ));
  }, [search, teachers]);

  const columns = [
    { key: 'name', label: 'Docente', render: (teacher) => <div className="school-person-cell"><span className="school-user-avatar"><UsersRound size={17} /></span><span><strong>{teacher.full_name}</strong><small>{teacher.email || teacher.username || 'Personal docente'}</small></span></div> },
    { key: 'assignments', label: 'Asignaciones', render: (teacher) => {
      const count = assignments.filter((item) => item.teacher_id === teacher.id).length;
      return <span className="school-version-badge">{count}</span>;
    } },
    { key: 'groups', label: 'Cursos y secciones', render: (teacher) => {
      const own = assignments.filter((item) => item.teacher_id === teacher.id);
      return own.length
        ? <div className="school-tag-list">{own.map((item) => <span key={item.id}>{item.subject_name} · {item.grade_level} {item.section}</span>)}</div>
        : <span className="school-muted">Sin asignaciones registradas</span>;
    } },
  ];

  return (
    <div className="school-page">
      <header className="school-page-heading">
        <div><span className="school-eyebrow">EQUIPO ACADÉMICO</span><h2>Directorio docente</h2><p>Personal docente y cursos vinculados a cada sección.</p></div>
      </header>
      {error && <div className="school-alert school-alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
      <section className="school-kpi-grid">
        <article className="school-kpi-card"><span className="school-kpi-icon kpi-purple"><UsersRound size={19} /></span><div><p>Docentes en el directorio</p><strong>{loading ? '—' : teachers.length}</strong><small>{user.role === 'director' ? 'Cuentas con rol docente' : 'Docentes con asignación'}</small></div></article>
        <article className="school-kpi-card"><span className="school-kpi-icon kpi-blue"><UsersRound size={19} /></span><div><p>Asignaciones académicas</p><strong>{loading ? '—' : assignments.length}</strong><small>Cursos y secciones vinculados</small></div></article>
      </section>
      <section className="school-panel">
        <div className="school-list-toolbar">
          <div><h3>Docentes y asignaciones</h3><p className="school-subtle-copy">La API permite consultar usuarios completos solo a Dirección; otros roles ven docentes con asignaciones.</p></div>
          <label className="school-search"><Search size={17} /><span className="sr-only">Buscar docente</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar docente" /></label>
        </div>
        <SchoolTable columns={columns} rows={visibleTeachers} emptyMessage={loading ? 'Cargando directorio…' : 'No se encontraron docentes.'} />
      </section>
    </div>
  );
}
