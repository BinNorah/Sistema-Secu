import React, { useState, useEffect } from 'react';
import Modal from '../../../componentes/interfaz/Modal';
import { servicioAlumnos } from '../../referencias/alumnos/servicio_alumnos';
import { servicioProfesores } from '../../referencias/profesores/servicio_profesores';

export default function ModalFormularioNota({ abierto, alCerrar, alGuardar, notaAEditar }) {
  const [alumnos, setAlumnos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const [formulario, setFormulario] = useState({
    alumno_id: '',
    profesor_id: '',
    asignatura: 'Matemáticas',
    calificacion: '',
    observacion: '',
  });

  useEffect(() => {
    if (abierto) {
      cargarReferencias();
      if (notaAEditar) {
        setFormulario({
          alumno_id: notaAEditar.alumno_id,
          profesor_id: notaAEditar.profesor_id,
          asignatura: notaAEditar.asignatura || 'Matemáticas',
          calificacion: notaAEditar.calificacion ?? '',
          observacion: notaAEditar.observacion || '',
        });
      } else {
        setFormulario({
          alumno_id: '',
          profesor_id: '',
          asignatura: 'Matemáticas',
          calificacion: '',
          observacion: '',
        });
      }
      setError('');
    }
  }, [abierto, notaAEditar]);

  const cargarReferencias = async () => {
    try {
      setCargando(true);
      const [listaAlumnos, listaProfesores] = await Promise.all([
        servicioAlumnos.listar(),
        servicioProfesores.listar(),
      ]);
      setAlumnos(listaAlumnos);
      setProfesores(listaProfesores);
    } catch (err) {
      setError('Error al cargar datos de soporte: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const cal = parseFloat(formulario.calificacion);
    if (isNaN(cal) || cal < 0 || cal > 20) {
      setError('La calificación debe ser un valor numérico entre 0.0 y 20.0');
      return;
    }

    if (!formulario.profesor_id) {
      setError('Debe seleccionar el profesor evaluador');
      return;
    }

    if (!notaAEditar && !formulario.alumno_id) {
      setError('Debe seleccionar el estudiante a calificar');
      return;
    }

    try {
      setEnviando(true);
      setError('');
      await alGuardar({
        ...formulario,
        alumno_id: Number(formulario.alumno_id),
        profesor_id: Number(formulario.profesor_id),
        calificacion: cal,
      });
      alCerrar();
    } catch (err) {
      setError(err.message || 'Error al guardar la calificación');
    } finally {
      setEnviando(false);
    }
  };

  const esEdicion = !!notaAEditar;

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={esEdicion ? 'Modificar Calificación (Memento)' : 'Registrar Nueva Calificación'}
      subtitulo={
        esEdicion
          ? 'Al guardar, se capturará automáticamente una nueva instantánea (Memento) en SQLite para trazabilidad'
          : 'Se registrará la nota y su primera instantánea (versión 1)'
      }
    >
      <form onSubmit={manejarEnvio} className="formulario-espaciado">
        {error && <div className="mensaje-error-form">{error}</div>}

        {!esEdicion ? (
          <div className="campo-form">
            <label className="etiqueta-form">Estudiante *</label>
            <select
              name="alumno_id"
              value={formulario.alumno_id}
              onChange={manejarCambio}
              required
              disabled={cargando}
              className="control-input"
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_completo} ({a.codigo_alumno})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="campo-form">
            <label className="etiqueta-form">Estudiante</label>
            <input
              type="text"
              readOnly
              value={`${notaAEditar.nombre_alumno} (${notaAEditar.codigo_alumno})`}
              className="control-input input-bloqueado"
            />
          </div>
        )}

        <div className="campo-form">
          <label className="etiqueta-form">Profesor Evaluador *</label>
          <select
            name="profesor_id"
            value={formulario.profesor_id}
            onChange={manejarCambio}
            required
            disabled={cargando}
            className="control-input"
          >
            <option value="">-- Seleccionar Docente --</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo} - {p.especialidad}
              </option>
            ))}
          </select>
        </div>

        <div className="fila-dos-columnas">
          <div className="campo-form">
            <label className="etiqueta-form">Asignatura *</label>
            <input
              type="text"
              name="asignatura"
              value={formulario.asignatura}
              onChange={manejarCambio}
              required
              className="control-input"
              placeholder="Ej: Matemáticas, Comunicación"
            />
          </div>

          <div className="campo-form">
            <label className="etiqueta-form">Calificación (0 - 20) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              name="calificacion"
              value={formulario.calificacion}
              onChange={manejarCambio}
              required
              className="control-input font-bold"
              placeholder="0.0 - 20.0"
            />
          </div>
        </div>

        <div className="campo-form">
          <label className="etiqueta-form">Observación / Descripción de la Evaluación</label>
          <textarea
            name="observacion"
            value={formulario.observacion}
            onChange={manejarCambio}
            rows={2}
            className="control-input"
            placeholder="Ej: Examen Parcial, Trabajo Práctico, Reclamo atendido..."
          />
        </div>

        <div className="modal-acciones">
          <button type="button" onClick={alCerrar} className="btn-secundario" disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando ? 'Guardando en SQLite...' : esEdicion ? 'Guardar y Generar Instantánea' : 'Registrar Calificación'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

