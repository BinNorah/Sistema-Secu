import React, { useState, useEffect } from 'react';
import Modal from '../../../componentes/interfaz/Modal';
import InsigniaEstado from '../../../componentes/interfaz/InsigniaEstado';
import { CheckCircle2, XCircle, Ban, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ModalTransicionEstado({ abierto, alCerrar, alTransicionar, matricula }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState('');

  useEffect(() => {
    if (abierto) {
      setNuevoEstado('');
      setMotivo('');
      setErrorBackend('');
    }
  }, [abierto, matricula]);

  if (!matricula) return null;

  const estadoActual = matricula.estado;

  // Opciones permitidas según el ciclo de vida
  const obtenerOpcionesValidas = () => {
    switch (estadoActual) {
      case 'Pendiente':
        return [
          { valor: 'Aprobada', etiqueta: 'Aprobar Matrícula', icono: <CheckCircle2 size={18} className="text-emerald-600" /> },
          { valor: 'Rechazada', etiqueta: 'Rechazar Matrícula', icono: <XCircle size={18} className="text-rose-600" /> },
        ];
      case 'Aprobada':
        return [
          { valor: 'Anulada', etiqueta: 'Anular Matrícula', icono: <Ban size={18} className="text-amber-600" /> },
        ];
      case 'Rechazada':
      case 'Anulada':
      default:
        return [];
    }
  };

  const opcionesValidas = obtenerOpcionesValidas();
  const esTerminal = opcionesValidas.length === 0;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nuevoEstado) {
      setErrorBackend('Por favor seleccione una acción para cambiar el estado');
      return;
    }

    try {
      setEnviando(true);
      setErrorBackend('');
      await alTransicionar(matricula.id, nuevoEstado, motivo);
      alCerrar();
    } catch (err) {
      setErrorBackend(err.message || 'Error al actualizar el estado');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Actualizar Estado de Matrícula"
      subtitulo={`Matrícula #${matricula.id} - ${matricula.nombre_alumno}`}
      ancho="max-w-md"
    >
      <form onSubmit={manejarEnvio} className="formulario-espaciado">
        {/* Estado Actual */}
        <div className="caja-estado-actual">
          <span className="etiqueta-pequena">Estado Actual:</span>
          <div className="mt-1">
            <InsigniaEstado estado={estadoActual} />
          </div>
        </div>

        {errorBackend && (
          <div className="caja-error-patron">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{errorBackend}</p>
            </div>
          </div>
        )}

        {esTerminal ? (
          <div className="caja-estado-terminal">
            <AlertTriangle className="text-amber-600 mb-2 mx-auto" size={24} />
            <h4 className="font-semibold text-amber-900 text-sm">Estado Definitivo</h4>
            <p className="text-xs text-amber-800 mt-1">
              {estadoActual === 'Rechazada'
                ? 'Esta matrícula se encuentra rechazada. Para este alumno debe registrarse una nueva matrícula.'
                : 'Esta matrícula se encuentra anulada de forma definitiva.'}
            </p>
          </div>
        ) : (
          <div className="campo-form">
            <label className="etiqueta-form">Seleccione la acción a realizar:</label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {opcionesValidas.map((opcion) => (
                <button
                  type="button"
                  key={opcion.valor}
                  onClick={() => setNuevoEstado(opcion.valor)}
                  className={`btn-seleccion-transicion ${nuevoEstado === opcion.valor ? 'seleccionado' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {opcion.icono}
                    <span className="font-medium">{opcion.etiqueta}</span>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="campo-form">
          <label className="etiqueta-form">Motivo u Observación</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="control-input"
            placeholder="Ingrese el motivo o comentario del cambio..."
          />
        </div>

        <div className="modal-acciones">
          <button type="button" onClick={alCerrar} className="btn-secundario" disabled={enviando}>
            Cancelar
          </button>
          {!esTerminal && (
            <button
              type="submit"
              className="btn-primario"
              disabled={enviando || !nuevoEstado}
            >
              {enviando ? 'Guardando...' : 'Confirmar Cambio'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
