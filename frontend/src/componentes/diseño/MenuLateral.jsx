import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Award } from 'lucide-react';

export default function MenuLateral() {
  const enlaces = [
    {
      ruta: '/',
      nombre: 'Panel Principal',
      icono: <LayoutDashboard size={19} />,
      descripcion: 'Resumen general del periodo',
    },
    {
      ruta: '/matriculas',
      nombre: 'Matrículas',
      icono: <UserCheck size={19} />,
      descripcion: 'Control y estados de matrícula',
    },
    {
      ruta: '/notas',
      nombre: 'Calificaciones',
      icono: <Award size={19} />,
      descripcion: 'Registro y control de notas',
    },
  ];

  return (
    <aside className="menu-lateral">
      <div className="menu-seccion-titulo">MENÚ PRINCIPAL</div>
      <nav className="menu-navegacion">
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            className={({ isActive }) => `menu-item ${isActive ? 'menu-item-activo' : ''}`}
          >
            <div className="menu-item-icono">{enlace.icono}</div>
            <div className="menu-item-texto">
              <div className="menu-item-nombre">{enlace.nombre}</div>
              <div className="menu-item-desc">{enlace.descripcion}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="menu-pie">
        <span className="texto-sistema-pie">Sistema Escolar v1.0</span>
        <span className="texto-periodo-pie">Periodo Lectivo 2026</span>
      </div>
    </aside>
  );
}
