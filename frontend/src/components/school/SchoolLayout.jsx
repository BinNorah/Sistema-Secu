import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import SchoolHeader from './SchoolHeader';
import SchoolSidebar from './SchoolSidebar';

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (error) {
    console.error('No se pudo leer el usuario guardado.', error);
    localStorage.removeItem('user');
    return null;
  }
}

export default function SchoolLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');
  const user = readUser();

  if (!token || !user?.role) return <Navigate to="/login" replace />;

  return (
    <div className="school-shell">
      {sidebarOpen && (
        <button
          className="school-sidebar-scrim"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}
      <SchoolSidebar user={user} isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="school-main">
        <SchoolHeader user={user} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="school-content">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
