import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronRight, ExternalLink, FileText, Search } from 'lucide-react';
import api, { API_BASE_URL } from '../../api/client';
import { FormField, SchoolForm } from '../../components/school/SchoolForm';
import SchoolModal from '../../components/school/SchoolModal';
import SchoolTable from '../../components/school/SchoolTable';
import StatusBadge from '../../components/school/StatusBadge';

const filters = ['Todos', 'Pendiente', 'Aprobada', 'Observada', 'Anulada'];
const lower = (value) => String(value || '').toLocaleLowerCase();
const fullName = (student) => student?.full_name || [student?.names, student?.surnames].filter(Boolean).join(' ') || 'Estudiante';

function canTransition(status, target) {
  const current = lower(status);
  if (target === 'Aprobada') return ['pendiente', 'observada'].includes(current);
  if (target === 'Anulada') return ['pendiente', 'observada', 'aprobada'].includes(current);
  if (target === 'Retirada') return current === 'aprobada';
  return false;
}

export default function EnrollmentsPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadRows() {
    try {
      const response = await api.get('/enrollments');
      setError('');
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data);
      setSelected((current) => data.find((item) => item.id === current?.id) || data[0] || null);
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar las matrículas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get('/enrollments')
      .then((response) => {
        if (!active) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setRows(data);
        setSelected(data[0] || null);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No se pudieron cargar las matrículas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((item) => lower(item.status) === 'pendiente').length,
    active: rows.filter((item) => lower(item.status) === 'aprobada').length,
    observed: rows.filter((item) => lower(item.status) === 'observada').length,
  }), [rows]);

  const visibleRows = rows.filter((item) => {
    const matchesStatus = filter === 'Todos' || lower(item.status) === lower(filter);
    const query = lower(search.trim());
    const matchesQuery = !query || [fullName(item.student), item.student?.dni, item.code, item.grade_level, item.section]
      .some((value) => lower(value).includes(query));
    return matchesStatus && matchesQuery;
  });

  async function submitTransition() {
    if (!selected || !pendingAction) return;
    try {
      setSaving(true);
      setError('');
      const response = await api.patch(`/enrollments/${selected.id}/state`, {
        status: pendingAction.target,
        reason: reason.trim() || pendingAction.defaultReason,
      });
      setNotice(response.message || 'Se actualizó el estado de la matrícula.');
      setPendingAction(null);
      setReason('');
      await loadRows();
    } catch (saveError) {
      setError(saveError.message || 'No se pudo actualizar el estado.');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'code', label: 'Código', render: (item) => <strong className="school-code">{item.code}</strong> },
    { key: 'student', label: 'Estudiante', render: (item) => <div className="school-cell-primary"><strong>{fullName(item.student)}</strong><small>DNI {item.student?.dni || '—'}</small></div> },
    { key: 'grade_level', label: 'Grado y sección', render: (item) => <span>{item.grade_level || '—'}{item.section ? ` · ${item.section}` : ''}</span> },
    { key: 'payment_status', label: 'Pago', render: (item) => <span className={`school-payment ${lower(item.payment_status) === 'pagado' ? 'is-paid' : ''}`}>{item.payment_status || 'Pendiente'}</span> },
    { key: 'status', label: 'Estado', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'action', label: '', align: 'align-right', render: (item) => (
        <button type="button" className="school-row-action" onClick={() => setSelected(item)} aria-label={`Ver solicitud ${item.code}`}>
          <ChevronRight size={17} />
        </button>
      ),
    },
  ];

  return (
    <div className="school-page">
      <header className="school-page-heading">
        <div><span className="school-eyebrow">ADMISIÓN Y REGISTRO</span><h2>Gestión de matrículas</h2><p>Revisa expedientes, valida documentos y gestiona las transiciones permitidas.</p></div>
        <button className="school-button school-button--secondary" type="button" onClick={loadRows}>Actualizar</button>
      </header>
      {error && <div className="school-alert school-alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="school-alert school-alert--success" role="status"><Check size={17} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar">×</button></div>}

      <section className="school-kpi-grid school-kpi-grid--four">
        <article className="school-kpi-card"><div><p>Solicitudes</p><strong>{loading ? '—' : counts.total}</strong><small>Expedientes recibidos</small></div></article>
        <article className="school-kpi-card"><div><p>Pendientes</p><strong>{loading ? '—' : counts.pending}</strong><small>En evaluación</small></div></article>
        <article className="school-kpi-card"><div><p>Formalizadas</p><strong>{loading ? '—' : counts.active}</strong><small>Estado aprobado</small></div></article>
        <article className="school-kpi-card"><div><p>Observadas</p><strong>{loading ? '—' : counts.observed}</strong><small>Requieren subsanación</small></div></article>
      </section>

      <section className="school-panel">
        <div className="school-list-toolbar">
          <label className="school-search">
            <Search size={17} /><span className="sr-only">Buscar expediente</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alumno, DNI o código" />
          </label>
          <div className="school-filter-tabs" role="group" aria-label="Filtrar por estado">
            {filters.map((status) => (
              <button key={status} type="button" onClick={() => setFilter(status)} className={filter === status ? 'is-selected' : ''}>
                {status}{status === 'Todos' ? ` (${rows.length})` : ''}
              </button>
            ))}
          </div>
        </div>
        <SchoolTable
          columns={columns}
          rows={visibleRows}
          emptyMessage={loading ? 'Cargando matrículas…' : 'No hay expedientes que coincidan con los filtros.'}
        />
      </section>

      {selected && (
        <section className="school-panel school-enrollment-detail">
          <header className="school-panel-header">
            <div><span className="school-eyebrow">EXPEDIENTE SELECCIONADO</span><h3>{selected.code}</h3></div>
            <StatusBadge status={selected.status} />
          </header>
          <div className="school-detail-grid">
            <div><span>Estudiante</span><strong>{fullName(selected.student)}</strong></div>
            <div><span>DNI</span><strong>{selected.student?.dni || '—'}</strong></div>
            <div><span>Grado / sección</span><strong>{selected.grade_level || '—'} · {selected.section || '—'}</strong></div>
            <div><span>Apoderado</span><strong>{fullName(selected.guardian)}</strong></div>
            <div><span>Teléfono de contacto</span><strong>{selected.guardian?.phone || '—'}</strong></div>
            <div><span>Estado del pago</span><strong>{selected.payment_status || 'Pendiente'}</strong></div>
          </div>
          {selected.observation && <div className="school-observation"><strong>Observaciones</strong><p>{selected.observation}</p></div>}
          {selected.report_card_url && (
            <a className="school-document-link" href={`${API_BASE_URL}${selected.report_card_url}`} target="_blank" rel="noreferrer">
              <FileText size={17} /> Ver documento académico <ExternalLink size={14} />
            </a>
          )}
          <div className="school-state-actions">
            <span className="school-action-label">Transiciones de estado</span>
            <div className="school-button-row">
              <button type="button" className="school-button school-button--primary" disabled={!canTransition(selected.status, 'Aprobada')} onClick={() => setPendingAction({ title: 'Confirmar matrícula', target: 'Aprobada', defaultReason: 'Expediente verificado por secretaría' })}>Confirmar</button>
              <button type="button" className="school-button school-button--warning" disabled={!canTransition(selected.status, 'Retirada')} onClick={() => setPendingAction({ title: 'Registrar retiro', target: 'Anulada', defaultReason: 'Matrícula retirada por traslado escolar' })}>Retirar</button>
              <button type="button" className="school-button school-button--danger" disabled={!canTransition(selected.status, 'Anulada')} onClick={() => setPendingAction({ title: 'Anular matrícula', target: 'Anulada', defaultReason: 'Matrícula anulada por secretaría' })}>Anular</button>
              <button type="button" className="school-button school-button--secondary" disabled title="La API actual no permite finalizar matrículas">Finalizar</button>
            </div>
            <small>Las acciones deshabilitadas no están permitidas por el estado o aún no cuentan con soporte en la API.</small>
          </div>
        </section>
      )}

      <SchoolModal
        open={Boolean(pendingAction)}
        onClose={() => !saving && setPendingAction(null)}
        title={pendingAction?.title}
        description="Confirma la transición y deja constancia del motivo en el expediente."
        size="small"
      >
        <SchoolForm onSubmit={(event) => { event.preventDefault(); submitTransition(); }}>
          <FormField label="Motivo u observación">
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={pendingAction?.defaultReason} />
          </FormField>
          <div className="school-modal-actions">
            <button type="button" className="school-button school-button--secondary" onClick={() => setPendingAction(null)} disabled={saving}>Cancelar</button>
            <button type="submit" className="school-button school-button--primary" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar cambio'}</button>
          </div>
        </SchoolForm>
      </SchoolModal>
    </div>
  );
}
