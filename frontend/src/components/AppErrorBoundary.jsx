import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error al mostrar la pantalla:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-screen" role="alert">
          <div>
            <h1>No se pudo cargar esta pantalla</h1>
            <p>Recarga la página. Si el problema continúa, vuelve a iniciar sesión.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
