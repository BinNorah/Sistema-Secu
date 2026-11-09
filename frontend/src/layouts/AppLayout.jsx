import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const dashboardPaths = new Set(['/secretaria', '/director', '/profesor']);

export default function AppLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {!dashboardPaths.has(pathname) && !pathname.startsWith('/app') && <Navbar />}
      <div className="w-full">{children}</div>
    </div>
  );
}
