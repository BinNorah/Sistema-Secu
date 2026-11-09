import React from 'react';
import { School, User, Calendar, CheckCircle } from 'lucide-react';

export default function BarraNavegacion() {
  return (
    <header className="barra-superior">
      <div className="barra-superior-info">
        <div className="logo-icono">
          <School size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="sistema-nombre">Secretaría Institucional • Sistema Escolar</h1>
          <span className="sistema-subtitulo">Panel de Matrículas y Emisión de Código Oficial</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
          <Calendar size={14} className="text-indigo-600" />
          <span>Año Académico: <strong>2026</strong></span>
        </div>

        <div className="barra-superior-usuario">
          <div className="avatar-usuario">
            <User size={16} />
          </div>
          <div className="datos-usuario">
            <span className="nombre-usuario">Lic. Eduardo Gálvez</span>
            <span className="rol-usuario">Operador de Secretaría</span>
          </div>
        </div>
      </div>
    </header>
  );
}
