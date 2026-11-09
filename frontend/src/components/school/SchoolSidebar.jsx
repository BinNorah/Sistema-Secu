import { NavLink } from 'react-router-dom';
import {
  Activity,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  School,
  UsersRound,
} from 'lucide-react';

const navigation = [
  { to: '/app', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/app/matriculas', label: 'Matrículas', icon: GraduationCap, roles: ['secretaria', 'director'] },
  { to: '/app/notas', label: 'Notas', icon: BookOpenCheck, roles: ['profesor', 'director'] },
  { to: '/app/asistencias', label: 'Asistencias', icon: Activity },
  { to: '/app/clases', label: 'Clases y horarios', icon: CalendarDays },
  { to: '/app/docentes', label: 'Docentes', icon: UsersRound },
];

export default function SchoolSidebar({ user, isOpen = false, onNavigate }) {
  const items = navigation.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <aside className={`school-sidebar${isOpen ? ' is-open' : ''}`}>
      <NavLink className="school-brand" to="/app">
        <span className="school-brand-mark"><School size={22} /></span>
        <span className="school-brand-copy">
          <strong>San Juan</strong>
          <small>Sistema escolar</small>
        </span>
      </NavLink>

      <div className="school-nav-caption">GESTIÓN ACADÉMICA</div>
      <nav className="school-nav" aria-label="Navegación principal">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `school-nav-link${isActive ? ' is-active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="school-sidebar-footer">
        <span className="school-status-dot" />
        <span>Periodo académico 2026</span>
      </div>
    </aside>
  );
}
