import React, { useState, useEffect } from 'react';
import Modal from '../../../componentes/interfaz/Modal';
import { History, RotateCcw, RotateCw, CheckCircle, Clock } from 'lucide-react';
import { servicioNotas } from '../servicios/servicio_notas';

export default function ModalHistorialNota({ abierto, alCerrar, notaId, alActualizar }) {
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (abierto && notaId) {
      cargarHistorial();
      setMensaje({ tipo: '', texto: '' });
    }
  }, [abierto, notaId]);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const datos = await servicioNotas.obtenerHistorial(notaId);
      setHistorial(datos);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al consultar historial: ' + err.message });
    } finally {
      setCargando(false);
    }
  };

  const ejecutarDeshacer = async () => {
    try {
      setProcesando(true);
      await servicioNotas.deshacer(notaId);
      setMensaje({ tipo: 'exito', texto: 'Se restauró la versión anterior.' });
      await cargarHistorial();
      alActualizar?.();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarRehacer = async () => {
    try {
      setProcesando(true);
      await servicioNotas.rehacer(notaId);
      setMensaje({ tipo: 'exito', texto: 'Se avanzó a la versión posterior.' });
      await cargarHistorial();
      alActualizar?.();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarRestaurar = async (mementoId, version) => {
    if (!window.confirm(`¿Desea restaurar la nota al estado de la versión v${version}?`)) {
      return;
    }

    try {
      setProcesando(true);
      await servicioNotas.restaurarVersion(notaId, mementoId);
      setMensaje({ tipo: 'exito', texto: `Nota restaurada a la versión v${version}.` });
      await cargarHistorial();
      alActualizar?.();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setProcesando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Historial de Modificaciones"
      subtitulo={`Registro de auditoría y versiones de la Nota #${notaId}`}
      ancho="max-w-2xl"
    >
      <div className="formulario-espaciado">
        {/* Encabezado con versión actual y botones de Undo/Redo */}
        <div className="caja-memento-header">
          <div>
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              <span className="font-bold text-gray-900 text-sm">
                Versión actual: <span className="text-indigo-600 font-mono">v{historial?.version_actual || 1}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Total de versiones registradas: <strong>{historial?.total_versiones || 0}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ejecutarDeshacer}
              disabled={procesando || !historial?.puede_deshacer}
              className="btn-undo-redo"
              title="Deshacer (versión anterior)"
            >
              <RotateCcw size={15} />
              <span>Deshacer</span>
            </button>

            <button
              type="button"
              onClick={ejecutarRehacer}
              disabled={procesando || !historial?.puede_rehacer}
              className="btn-undo-redo"
              title="Rehacer (versión posterior)"
            >
              <RotateCw size={15} />
              <span>Rehacer</span>
            </button>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`p-2.5 rounded-lg text-xs font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Línea de Tiempo de Versiones */}
        <div className="contenedor-linea-tiempo">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
            Versiones anteriores:
          </h4>

          {cargando ? (
            <p className="text-xs text-gray-500 py-4 text-center">Cargando versiones...</p>
          ) : !historial?.instantaneas?.length ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay versiones registradas.</p>
          ) : (
            <div className="lista-instantaneas">
              {historial.instantaneas.map((m) => {
                const esActiva = m.version === historial.version_actual;
                const aprobatoria = m.calificacion >= 11;

                return (
                  <div
                    key={m.id}
                    className={`item-instantanea ${esActiva ? 'instantanea-activa' : ''}`}
                  >
                    <div className="instantanea-indicador">
                      <div className={`circulo-version ${esActiva ? 'circulo-activo' : ''}`}>
                        v{m.version}
                      </div>
                    </div>

                    <div className="instantanea-contenido">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`nota-valor-badge ${aprobatoria ? 'nota-aprobada' : 'nota-desaprobada'}`}>
                            {Number(m.calificacion).toFixed(1)}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">{m.asignatura}</span>
                          <span className="badge-accion-memento">{m.accion}</span>
                        </div>

                        {esActiva ? (
                          <span className="etiqueta-version-actual">
                            <CheckCircle size={14} />
                            Versión Activa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => ejecutarRestaurar(m.id, m.version)}
                            disabled={procesando}
                            className="btn-restaurar-version"
                            title="Restaurar a esta versión"
                          >
                            Restaurar esta versión
                          </button>
                        )}
                      </div>

                      {m.observacion && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{m.observacion}"
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5 font-mono">
                        <Clock size={12} />
                        <span>{formatearFecha(m.fecha)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-acciones">
          <button type="button" onClick={alCerrar} className="btn-secundario">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
