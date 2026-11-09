import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  School,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/client';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }

        // The API role selects the first allowed module.
        const role = response.user.role?.toLowerCase();
        if (role === 'secretaria') {
          navigate('/app/matriculas');
        } else if (role === 'director') {
          navigate('/app');
        } else if (role === 'profesor') {
          navigate('/app/notas');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('El usuario no tiene un rol habilitado para acceder al sistema.');
        }
      } else {
        setError('El servidor no devolvió una sesión válida.');
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas o usuario deshabilitado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-login-page">
      <div className="login-layout">
        <aside className="login-welcome-panel">
          <div className="login-welcome-brand">
            <span className="login-welcome-logo"><School size={24} /></span>
            <span><strong>San Juan Bautista</strong><small>Portal institucional</small></span>
          </div>
          <div className="login-welcome-copy">
            <span className="login-kicker"><ShieldCheck size={15} /> Acceso seguro para la comunidad</span>
            <h1>Todo el colegio,<br />en un solo lugar.</h1>
            <p>Ingresa a tus herramientas académicas y acompaña cada avance del año escolar.</p>
          </div>
          <div className="login-benefits">
            <div><CheckCircle2 size={17} /><span>Información académica centralizada</span></div>
            <div><CheckCircle2 size={17} /><span>Acceso según tu perfil institucional</span></div>
            <div><CheckCircle2 size={17} /><span>Un espacio para docentes y administración</span></div>
          </div>
          <div className="login-welcome-footer">Colegio Secundario San Juan Bautista <span>·</span> 2026</div>
        </aside>

        <section className="login-form-panel">
          <Link to="/" className="login-back-link"><ArrowLeft size={16} /> Volver al sitio institucional</Link>
          <div className="login-form-heading">
            <span className="login-form-icon"><LogIn size={20} /></span>
            <span className="login-kicker">PORTAL ACADÉMICO</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Usa las credenciales asignadas por la institución para continuar.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="login-username">Usuario</label>
              <input
                type="text"
                id="login-username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario institucional"
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                type="password"
                id="login-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              <span>{loading ? 'Verificando acceso…' : 'Ingresar al portal'}</span>
              <LogIn size={17} />
            </button>
          </form>
          <p className="login-help">¿Necesitas ayuda para ingresar? Comunícate con Secretaría.</p>
        </section>
      </div>
    </div>
  );
}
