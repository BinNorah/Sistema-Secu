import { BrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AppRoutes from './pages/AppRoutes';
import AppErrorBoundary from './components/AppErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
      </AppLayout>
    </BrowserRouter>
  );
}
