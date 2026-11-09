const styles = {
  PENDIENTE: 'badge-pending',
  OBSERVADA: 'badge-pending',
  ACTIVA: 'badge-active',
  APROBADA: 'badge-active',
  RETIRADA: 'badge-muted',
  ANULADA: 'badge-muted',
  FINALIZADA: 'badge-finished',
};

export default function StatusBadge({ status }) {
  const normalized = String(status || '').toLocaleUpperCase();
  const label = normalized === 'APROBADA' ? 'ACTIVA' : normalized || 'SIN ESTADO';
  return <span className={`school-badge ${styles[normalized] || 'badge-muted'}`}>{label}</span>;
}
