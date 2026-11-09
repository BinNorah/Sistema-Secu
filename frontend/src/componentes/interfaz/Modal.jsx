import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ abierto, alCerrar, titulo, subtitulo, children, ancho = 'max-w-md' }) {
  useEffect(() => {
    const alPresionarEsc = (e) => {
      if (e.key === 'Escape' && abierto) alCerrar();
    };
    window.addEventListener('keydown', alPresionarEsc);
    return () => window.removeEventListener('keydown', alPresionarEsc);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal-fondo">
      <div className={`modal-tarjeta ${ancho}`}>
        <div className="modal-encabezado">
          <div>
            <h3 className="modal-titulo">{titulo}</h3>
            {subtitulo && <p className="modal-subtitulo">{subtitulo}</p>}
          </div>
          <button type="button" className="modal-boton-cerrar" onClick={alCerrar} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}

