import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, History, RotateCcw, RotateCw, Save } from 'lucide-react';
import api from '../../api/client';
import { FormSelect } from '../../components/school/SchoolForm';
import SchoolModal from '../../components/school/SchoolModal';
import SchoolTable from '../../components/school/SchoolTable';

const periods = [
  { value: 'b1', label: '1.er bimestre' },
  { value: 'b2', label: '2.º bimestre' },
  { value: 'b3', label: '3.er bimestre' },
  { value: 'b4', label: '4.º bimestre' },
];

function score(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [period, setPeriod] = useState('b1');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState(null);

  async function loadGrades() {
    try {
      const response = await api.get('/grades');
      setError('');
      setGrades(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar las calificaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get('/grades')
      .then((response) => {
        if (active) setGrades(Array.isArray(response.data) ? response.data : []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No se pudieron cargar las calificaciones.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const sections = useMemo(() => [...new Set(grades.map((grade) => `${grade.grade_level} · ${grade.section}`))].sort(), [grades]);
  const subjects = useMemo(() => [...new Set(grades.map((grade) => grade.subject_name).filter(Boolean))].sort(), [grades]);
  const filtered = grades.filter((grade) => (
    (!section || `${grade.grade_level} · ${grade.section}` === section)
    && (!subject || grade.subject_name === subject)
  ));
  const selectedGrade = filtered.find((grade) => grade.id === selectedGradeId);

  function valueFor(grade) {
    return drafts[grade.id] ?? score(grade[period]);
  }

  function updateDraft(grade, value) {
    setDrafts((current) => ({ ...current, [grade.id]: value }));
  }

  async function saveGrade(grade) {
    const newScore = Number(valueFor(grade));
    if (!Number.isFinite(newScore) || newScore < 0 || newScore > 20) {
      setError('Las notas deben estar entre 0 y 20.');
      return;
    }
    try {
      setSavingId(grade.id);
      setError('');
      const updated = {
        student_id: grade.student_id,
        subject_id: grade.subject_id,
        grade_level: grade.grade_level,
        section: grade.section,
        b1: score(grade.b1),
        b2: score(grade.b2),
        b3: score(grade.b3),
        b4: score(grade.b4),
        observation: grade.observation || '',
        [period]: newScore,
      };
      const response = await api.post('/grades', updated);
      setNotice(response.message || 'Nota guardada con una nueva versión de historial.');
      setDrafts((current) => {
        const next = { ...current };
        delete next[grade.id];
        return next;
      });
      await loadGrades();
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar la calificación.');
    } finally {
      setSavingId(null);
    }
  }

  async function changeVersion(grade, action) {
    try {
      setSavingId(grade.id);
      setError('');
      const response = await api.post(`/grades/${grade.id}/${action}`);
      setNotice(response.message || 'Se actualizó la versión de la calificación.');
      if (history?.grade.id === grade.id) {
        const refreshed = await api.get(`/grades/${grade.id}/history`);
        setHistory((current) => current && ({ ...current, data: refreshed.data }));
      }
      await loadGrades();
    } catch (actionError) {
      setError(actionError.message || 'No se pudo actualizar el historial.');
    } finally {
      setSavingId(null);
    }
  }

  async function openHistory(grade) {
    try {
      setHistoryLoading(true);
      setError('');
      const response = await api.get(`/grades/${grade.id}/history`);
      setHistory({ grade, data: response.data });
    } catch (historyError) {
      setError(historyError.message || 'No se pudo consultar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function restoreVersion(memento) {
    if (!history) return;
    try {
      setSavingId(history.grade.id);
      const response = await api.post(`/grades/${history.grade.id}/restore/${memento.id}`);
      setNotice(response.message || `Se restauró la versión ${memento.version}.`);
      const refreshed = await api.get(`/grades/${history.grade.id}/history`);
      setHistory((current) => current && ({ ...current, data: refreshed.data }));
      await loadGrades();
    } catch (restoreError) {
      setError(restoreError.message || 'No se pudo restaurar esta versión.');
    } finally {
      setSavingId(null);
    }
  }

  const columns = [
    { key: 'student', label: 'Estudiante', render: (grade) => <div className="school-cell-primary"><strong>{grade.student_name}</strong><small>{grade.grade_level} · Sección {grade.section}</small></div> },
    { key: 'subject_name', label: 'Curso' },
    { key: 'score', label: periods.find((item) => item.value === period)?.label, render: (grade) => (
      <input
        className="school-score-input"
        type="number"
        min="0"
        max="20"
        step="0.5"
        value={valueFor(grade)}
        aria-label={`${period} de ${grade.student_name}`}
        onFocus={() => setSelectedGradeId(grade.id)}
        onChange={(event) => updateDraft(grade, event.target.value)}
      />
    ) },
    { key: 'average', label: 'Promedio', render: (grade) => <strong className={score(grade.average) < 11 ? 'school-score-low' : 'school-score-good'}>{score(grade.average).toFixed(1)}</strong> },
    { key: 'version', label: 'Versión', render: (grade) => <span className="school-version-badge">v{grade.current_version}</span> },
    { key: 'actions', label: 'Acciones', align: 'align-right', render: (grade) => (
      <div className="school-grade-actions">
        <button type="button" className="school-button school-button--primary school-button--compact" disabled={savingId === grade.id} onClick={() => saveGrade(grade)} title="Guardar nota">
          <Save size={14} /> Guardar
        </button>
        <button type="button" className="school-icon-button school-undo-button" disabled={savingId === grade.id || grade.current_version <= 1} onClick={() => changeVersion(grade, 'undo')} title="Deshacer última modificación">
          <RotateCcw size={15} /><span className="sr-only">Deshacer</span>
        </button>
        <button type="button" className="school-icon-button" disabled={savingId === grade.id} onClick={() => openHistory(grade)} title="Ver historial">
          <History size={15} /><span className="sr-only">Historial</span>
        </button>
      </div>
    ) },
  ];

  return (
    <div className="school-page">
      <header className="school-page-heading">
        <div><span className="school-eyebrow">EVALUACIÓN ACADÉMICA · MEMENTO</span><h2>Registro de notas</h2><p>Filtra por sección, curso y periodo. Cada guardado genera una versión recuperable.</p></div>
        <button type="button" className="school-button school-button--undo" disabled={!selectedGrade || selectedGrade.current_version <= 1 || Boolean(savingId)} onClick={() => selectedGrade && changeVersion(selectedGrade, 'undo')}>
          <RotateCcw size={16} /> Deshacer{selectedGrade ? ` · ${selectedGrade.student_name}` : ''}
        </button>
      </header>
      {error && <div className="school-alert school-alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="school-alert school-alert--success" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar">×</button></div>}

      <section className="school-panel">
        <div className="school-filter-row">
          <label className="school-field"><span>Sección</span><FormSelect value={section} onChange={(event) => setSection(event.target.value)} placeholder="Todas las secciones" options={sections.map((value) => ({ value, label: value }))} /></label>
          <label className="school-field"><span>Curso</span><FormSelect value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Todos los cursos" options={subjects.map((value) => ({ value, label: value }))} /></label>
          <label className="school-field"><span>Periodo</span><FormSelect value={period} onChange={(event) => setPeriod(event.target.value)} options={periods} /></label>
          <div className="school-filter-summary"><strong>{filtered.length}</strong><span>registros visibles</span></div>
        </div>
        <SchoolTable columns={columns} rows={filtered} emptyMessage={loading ? 'Cargando calificaciones…' : 'No hay registros para estos filtros.'} />
      </section>

      <SchoolModal
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        title="Historial de calificaciones"
        description={history ? `${history.grade.student_name} · ${history.grade.subject_name}` : ''}
        size="large"
      >
        {historyLoading ? <p className="school-empty-state">Cargando historial…</p> : history && (
          <>
            <div className="school-history-summary">
              <span>Versión actual <strong>v{history.data.current_version}</strong></span>
              <span>{history.data.total_versions} versiones</span>
              <div className="school-grade-actions">
                <button type="button" className="school-button school-button--undo" disabled={!history.data.can_undo || Boolean(savingId)} onClick={() => changeVersion(history.grade, 'undo')}><RotateCcw size={15} /> Deshacer</button>
                <button type="button" className="school-button school-button--secondary" disabled={!history.data.can_redo || Boolean(savingId)} onClick={() => changeVersion(history.grade, 'redo')}><RotateCw size={15} /> Rehacer</button>
              </div>
            </div>
            <ol className="school-history-list">
              {(history.data.mementos || []).map((memento) => (
                <li key={memento.id} className={memento.version === history.data.current_version ? 'is-current' : ''}>
                  <span className="school-history-version">v{memento.version}</span>
                  <div><strong>{memento.action}</strong><small>{new Date(memento.created_at).toLocaleString('es-PE')}</small><p>B1 {memento.b1} · B2 {memento.b2} · B3 {memento.b3} · B4 {memento.b4} · Promedio {memento.average}</p></div>
                  {memento.version !== history.data.current_version && <button type="button" className="school-button school-button--secondary school-button--compact" disabled={Boolean(savingId)} onClick={() => restoreVersion(memento)}>Restaurar</button>}
                </li>
              ))}
            </ol>
          </>
        )}
      </SchoolModal>
    </div>
  );
}
