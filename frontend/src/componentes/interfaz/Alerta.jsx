import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Alerta({ tipo = 'info', mensaje, alCerrar }) {
  if (!mensaje) return null;

  const iconos = {
    exito: <CheckCircle className="icono-alerta text-green-600" size={20} />,
    error: <AlertCircle className="icono-alerta text-red-600" size={20} />,
    info: <Info className="icono-alerta text-blue-600" size={20} />,
  };

  return (
    <div className={`alerta alerta-${tipo}`}>
      <div className="alerta-contenido">
        {iconos[tipo] || iconos.info}
        <span className="alerta-texto">{mensaje}</span>
      </div>
      {alCerrar && (
        <button type="button" onClick={alCerrar} className="alerta-cerrar">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

