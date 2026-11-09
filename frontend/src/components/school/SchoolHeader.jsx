import { LogOut, Menu, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const titles = {
  '/app': 'Inicio',
  '/app/matriculas': 'Matrículas',
  '/app/notas': 'Notas',
  '/app/asistencias': 'Asistencias',
  '/app/clases': 'Clases y horarios',
  '/app/docentes': 'Docentes',
};

export default function SchoolHeader({ user, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'Sistema de gestión escolar';

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <header className="school-header">
      <div className="school-header-title">
        <button
          type="button"
          className="school-mobile-menu"
          onClick={onToggleSidebar}
          aria-label="Abrir navegación"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="school-breadcrumb">COLEGIO SECUNDARIO SAN JUAN</div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="school-header-actions">
        <div className="school-user">
          <span className="school-user-avatar">{(user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase()}</span>
          <span className="school-user-meta">
            <strong>{user?.full_name || user?.username}</strong>
            <small>{user?.role === 'director' ? 'Administrador' : user?.role === 'secretaria' ? 'Secretaría' : 'Docente'}</small>
          </span>
        </div>
        <button type="button" className="school-icon-button" onClick={() => window.location.reload()} title="Actualizar">
          <RefreshCw size={17} />
        </button>
        <button type="button" className="school-logout-button" onClick={signOut}>
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
