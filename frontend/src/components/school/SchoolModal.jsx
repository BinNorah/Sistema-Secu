import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SchoolModal({ open, title, description, onClose, children, size = 'medium' }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="school-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`school-modal school-modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="school-modal-title">
        <header className="school-modal-header">
          <div>
            <h2 id="school-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="school-icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="school-modal-body">{children}</div>
      </section>
    </div>
  );
}
