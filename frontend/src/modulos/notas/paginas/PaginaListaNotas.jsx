import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, History, Edit3, Trash2, RotateCcw, RotateCw } from 'lucide-react';
import { servicioNotas } from '../servicios/servicio_notas';
import Alerta from '../../../componentes/interfaz/Alerta';
import ModalFormularioNota from '../componentes/ModalFormularioNota';
import ModalHistorialNota from '../componentes/ModalHistorialNota';

export default function PaginaListaNotas() {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' });

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [notaAEditar, setNotaAEditar] = useState(null);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [notaIdHistorial, setNotaIdHistorial] = useState(null);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    try {
      setCargando(true);
      const lista = await servicioNotas.listar();
      setNotas(lista);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: 'Error al cargar calificaciones: ' + err.message });
    } finally {
      setCargando(false);
    }
  };

  const manejarGuardar = async (datos) => {
    try {
      if (notaAEditar) {
        await servicioNotas.actualizar(notaAEditar.id, datos);
        setAlerta({ tipo: 'exito', mensaje: 'Calificación actualizada correctamente' });
      } else {
        await servicioNotas.registrar(datos);
        setAlerta({ tipo: 'exito', mensaje: 'Nueva calificación registrada exitosamente' });
      }
      cargarNotas();
    } catch (err) {
      throw err;
    }
  };

  const manejarDeshacer = async (id) => {
    try {
      const res = await servicioNotas.deshacer(id);
      setAlerta({ tipo: 'exito', mensaje: res.mensaje || 'Se restauró la versión anterior de la calificación.' });
      cargarNotas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    }
  };

  const manejarRehacer = async (id) => {
    try {
      const res = await servicioNotas.rehacer(id);
      setAlerta({ tipo: 'exito', mensaje: res.mensaje || 'Se avanzó a la versión posterior de la calificación.' });
      cargarNotas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    }
  };

  const manejarEliminar = async (nota) => {
    if (!window.confirm(`¿Está seguro de eliminar la calificación de ${nota.asignatura} del alumno ${nota.nombre_alumno}?`)) {
      return;
    }

    try {
      await servicioNotas.eliminar(nota.id);
      setAlerta({ tipo: 'exito', mensaje: 'Calificación eliminada correctamente' });
      cargarNotas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: 'Error al eliminar: ' + err.message });
    }
  };

  const notasFiltradas = notas.filter((n) => {
    const texto = `${n.nombre_alumno} ${n.codigo_alumno} ${n.asignatura} ${n.nombre_profesor}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-encabezado">
        <div>
          <h2 className="pagina-titulo">Gestión de Calificaciones</h2>
          <p className="pagina-subtitulo">
            Registro, evaluación y control de notas con historial de versiones y auditoría.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNotaAEditar(null);
            setModalFormAbierto(true);
          }}
          className="btn-primario flex items-center gap-2"
        >
          <Plus size={18} />
          Registrar Calificación
        </button>
      </div>

      {alerta.mensaje && (
        <Alerta
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          alCerrar={() => setAlerta({ tipo: '', mensaje: '' })}
        />
      )}

      {/* Buscador */}
      <div className="tarjeta-filtros">
        <div className="buscador-contenedor flex-1">
          <Search size={16} className="icono-buscador" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por estudiante, código, materia o docente..."
            className="control-input input-buscador"
          />
        </div>
      </div>

      {/* Tabla de Notas */}
      <div className="tarjeta-tabla">
        {cargando ? (
          <div className="estado-cargando">
            <RefreshCw className="animacion-rotar text-indigo-600 mb-2" size={28} />
            <p>Cargando información de calificaciones...</p>
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="estado-vacio">
            <p className="text-gray-500 font-medium">No se encontraron calificaciones registradas.</p>
          </div>
        ) : (
          <div className="tabla-responsive">
            <table className="tabla-sistema">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estudiante</th>
                  <th>Asignatura</th>
                  <th>Docente</th>
                  <th>Calificación</th>
                  <th>Versión</th>
                  <th>Observación</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notasFiltradas.map((n) => {
                  const aprobatoria = n.calificacion >= 11;
                  return (
                    <tr key={n.id}>
                      <td className="font-mono text-xs text-gray-500">#{n.id}</td>
                      <td>
                        <div className="font-semibold text-gray-900">{n.nombre_alumno}</div>
                        <div className="text-xs text-gray-500 font-mono">{n.codigo_alumno}</div>
                      </td>
                      <td className="font-medium text-gray-800">{n.asignatura}</td>
                      <td className="text-xs text-gray-600">{n.nombre_profesor}</td>
                      <td>
                        <span className={`nota-valor-badge ${aprobatoria ? 'nota-aprobada' : 'nota-desaprobada'}`}>
                          {Number(n.calificacion).toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="badge-version-actual">
                          v{n.version_actual}
                        </span>
                      </td>
                      <td className="texto-truncado-col max-w-xs text-xs text-gray-600">
                        {n.observacion || '-'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Controles Deshacer / Rehacer */}
                          <button
                            type="button"
                            onClick={() => manejarDeshacer(n.id)}
                            className="btn-icono-accion text-gray-600 hover:text-indigo-600"
                            title="Deshacer (recuperar versión anterior)"
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => manejarRehacer(n.id)}
                            className="btn-icono-accion text-gray-600 hover:text-indigo-600"
                            title="Rehacer (avanzar a versión posterior)"
                          >
                            <RotateCw size={15} />
                          </button>

                          {/* Botón de Historial */}
                          <button
                            type="button"
                            onClick={() => {
                              setNotaIdHistorial(n.id);
                              setModalHistorialAbierto(true);
                            }}
                            className="btn-accion-memento"
                            title="Ver historial de cambios y versiones"
                          >
                            <History size={14} />
                            <span>Historial</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNotaAEditar(n);
                              setModalFormAbierto(true);
                            }}
                            className="btn-icono-accion text-blue-600"
                            title="Modificar calificación"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => manejarEliminar(n)}
                            className="btn-icono-accion text-red-600"
                            title="Eliminar calificación"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulario Nota */}
      <ModalFormularioNota
        abierto={modalFormAbierto}
        alCerrar={() => setModalFormAbierto(false)}
        alGuardar={manejarGuardar}
        notaAEditar={notaAEditar}
      />

      {/* Modal Historial */}
      <ModalHistorialNota
        abierto={modalHistorialAbierto}
        alCerrar={() => setModalHistorialAbierto(false)}
        notaId={notaIdHistorial}
        alActualizar={cargarNotas}
      />
    </div>
  );
}
