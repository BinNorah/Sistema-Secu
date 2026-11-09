import React from 'react';

// Insignia visual para identificar claramente el estado de la matrícula (Patrón State)
export default function InsigniaEstado({ estado }) {
  const normalizado = (estado || '').toLowerCase();

  let estilo = 'bg-gray-100 text-gray-800 border-gray-300';
  let etiqueta = estado || 'Desconocido';

  switch (normalizado) {
    case 'pendiente':
    case 'pending':
      estilo = 'badge-pendiente';
      etiqueta = 'Pendiente';
      break;
    case 'aprobada':
    case 'aprobado':
    case 'approved':
      estilo = 'badge-aprobada';
      etiqueta = 'Aprobada';
      break;
    case 'rechazada':
    case 'rechazado':
    case 'rejected':
      estilo = 'badge-rechazada';
      etiqueta = 'Rechazada';
      break;
    case 'anulada':
    case 'anulado':
    case 'cancelled':
      estilo = 'badge-anulada';
      etiqueta = 'Anulada';
      break;
    default:
      estilo = 'badge-neutro';
  }

  return (
    <span className={`insignia-estado ${estilo}`}>
      <span className="punto-estado"></span>
      {etiqueta}
    </span>
  );
}

