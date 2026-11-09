import React, { useState, useEffect } from 'react';
import Modal from '../../../componentes/interfaz/Modal';
import { servicioAlumnos } from '../../referencias/alumnos/servicio_alumnos';
import { UserPlus, Users, Building, ShieldCheck } from 'lucide-react';

export default function ModalFormularioMatricula({ abierto, alCerrar, alGuardar, matriculaAEditar }) {
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Modo: 'nuevo' (Nuevo Postulante) o 'existente' (Alumno ya en sistema)
  const [modoIngreso, setModoIngreso] = useState('nuevo');

  const [formulario, setFormulario] = useState({
    alumno_id: '',
    nombre_completo: '',
    codigo_dni: '',
    colegio_anterior: '',
    apoderado: '',
    telefono_apoderado: '',
    anio_academico: '2026',
    nivel_grado: '3ro Secundaria',
    seccion: 'A',
    observacion: '',
  });

  useEffect(() => {
    if (abierto) {
      cargarAlumnos();
      if (matriculaAEditar) {
        setFormulario({
          alumno_id: matriculaAEditar.alumno_id,
          nombre_completo: matriculaAEditar.nombre_alumno || '',
          codigo_dni: matriculaAEditar.codigo_alumno || '',
          colegio_anterior: 'I.E. San Juan Bautista',
          apoderado: 'Elena Carranza Ríos',
          telefono_apoderado: '984215889',
          anio_academico: matriculaAEditar.anio_academico || '2026',
          nivel_grado: matriculaAEditar.nivel_grado || '3ro Secundaria',
          seccion: matriculaAEditar.seccion || 'A',
          observacion: matriculaAEditar.observacion || '',
        });
      } else {
        setModoIngreso('nuevo');
        setFormulario({
          alumno_id: '',
          nombre_completo: '',
          codigo_dni: '',
          colegio_anterior: 'I.E. San Juan Bautista - UGEL 03',
          apoderado: '',
          telefono_apoderado: '',
          anio_academico: '2026',
          nivel_grado: '3ro Secundaria',
          seccion: 'A',
          observacion: 'Solicitud regular ingresada por secretaría.',
        });
      }
      setError('');
    }
  }, [abierto, matriculaAEditar]);

  const cargarAlumnos = async () => {
    try {
      setCargandoAlumnos(true);
      const lista = await servicioAlumnos.listar();
      setAlumnos(lista);
    } catch (err) {
      setError('Error al cargar la lista de alumnos: ' + err.message);
    } finally {
      setCargandoAlumnos(false);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');

    if (!matriculaAEditar) {
      if (modoIngreso === 'nuevo' && !formulario.nombre_completo.trim()) {
        setError('Por favor ingrese los nombres y apellidos del nuevo postulante');
        return;
      }
      if (modoIngreso === 'existente' && !formulario.alumno_id) {
        setError('Por favor seleccione un estudiante registrado');
        return;
      }
    }

    try {
      setEnviando(true);
      const payload = {
        anio_academico: formulario.anio_academico,
        nivel_grado: formulario.nivel_grado,
        seccion: formulario.seccion,
        observacion: formulario.observacion,
      };

      if (!matriculaAEditar) {
        if (modoIngreso === 'existente') {
          payload.alumno_id = Number(formulario.alumno_id);
        } else {
          payload.alumno_id = 0;
          payload.nombre_completo = formulario.nombre_completo.trim();
          payload.codigo_dni = formulario.codigo_dni.trim() || `DNI-${Date.now().toString().slice(-8)}`;
        }
      }

      await alGuardar(payload);
      alCerrar();
    } catch (err) {
      setError(err.message || 'Error al guardar la matrícula');
    } finally {
      setEnviando(false);
    }
  };

  const esEdicion = !!matriculaAEditar;

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={esEdicion ? 'Editar Expediente de Matrícula' : 'Registro de Nueva Matrícula'}
      subtitulo={
        esEdicion
          ? 'Actualice los datos académicos del expediente escolar'
          : 'La matrícula iniciará en estado Pendiente para revisión y posterior emisión de código'
      }
      ancho="max-w-lg"
    >
      <form onSubmit={manejarEnvio} className="formulario-espaciado">
        {error && <div className="mensaje-error-form">{error}</div>}

        {!esEdicion && (
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1 mb-2">
            <button
              type="button"
              onClick={() => setModoIngreso('nuevo')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                modoIngreso === 'nuevo' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus size={15} />
              <span>Nuevo Postulante</span>
            </button>

            <button
              type="button"
              onClick={() => setModoIngreso('existente')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                modoIngreso === 'existente' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={15} />
              <span>Estudiante Registrado</span>
            </button>
          </div>
        )}

        {/* Formulario según modo */}
        {!esEdicion && modoIngreso === 'nuevo' ? (
          <>
            <div className="campo-form">
              <label className="etiqueta-form">Nombres y Apellidos del Postulante *</label>
              <input
                type="text"
                name="nombre_completo"
                value={formulario.nombre_completo}
                onChange={manejarCambio}
                required
                className="control-input"
                placeholder="Ej: Mateo Alejandro Villanueva Carranza"
              />
            </div>

            <div className="fila-dos-columnas">
              <div className="campo-form">
                <label className="etiqueta-form">DNI del Estudiante *</label>
                <input
                  type="text"
                  name="codigo_dni"
                  value={formulario.codigo_dni}
                  onChange={manejarCambio}
                  required
                  maxLength={8}
                  className="control-input font-mono"
                  placeholder="Ej: 73489215"
                />
              </div>

              <div className="campo-form">
                <label className="etiqueta-form">Colegio de Procedencia</label>
                <input
                  type="text"
                  name="colegio_anterior"
                  value={formulario.colegio_anterior}
                  onChange={manejarCambio}
                  className="control-input"
                  placeholder="I.E. de origen"
                />
              </div>
            </div>

            <div className="fila-dos-columnas">
              <div className="campo-form">
                <label className="etiqueta-form">Nombre del Apoderado</label>
                <input
                  type="text"
                  name="apoderado"
                  value={formulario.apoderado}
                  onChange={manejarCambio}
                  className="control-input"
                  placeholder="Ej: Elena Carranza Ríos"
                />
              </div>

              <div className="campo-form">
                <label className="etiqueta-form">Teléfono de Contacto</label>
                <input
                  type="text"
                  name="telefono_apoderado"
                  value={formulario.telefono_apoderado}
                  onChange={manejarCambio}
                  className="control-input font-mono"
                  placeholder="984 215 889"
                />
              </div>
            </div>
          </>
        ) : !esEdicion && modoIngreso === 'existente' ? (
          <div className="campo-form">
            <label className="etiqueta-form">Seleccionar Estudiante *</label>
            <select
              name="alumno_id"
              value={formulario.alumno_id}
              onChange={manejarCambio}
              required
              disabled={cargandoAlumnos}
              className="control-input"
            >
              <option value="">-- Seleccionar de la lista --</option>
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
              value={`${matriculaAEditar.nombre_alumno} (${matriculaAEditar.codigo_alumno})`}
              className="control-input input-bloqueado font-bold"
            />
          </div>
        )}

        {/* Datos Académicos */}
        <div className="fila-dos-columnas">
          <div className="campo-form">
            <label className="etiqueta-form">Año Académico *</label>
            <input
              type="text"
              name="anio_academico"
              value={formulario.anio_academico}
              onChange={manejarCambio}
              required
              className="control-input"
              placeholder="2026"
            />
          </div>

          <div className="campo-form">
            <label className="etiqueta-form">Nivel / Grado de Secundaria *</label>
            <select
              name="nivel_grado"
              value={formulario.nivel_grado}
              onChange={manejarCambio}
              required
              className="control-input"
            >
              <option value="1ro Secundaria">1° de Secundaria</option>
              <option value="2do Secundaria">2° de Secundaria</option>
              <option value="3ro Secundaria">3° de Secundaria</option>
              <option value="4to Secundaria">4° de Secundaria</option>
              <option value="5to Secundaria">5° de Secundaria</option>
            </select>
          </div>
        </div>

        <div className="fila-dos-columnas">
          <div className="campo-form">
            <label className="etiqueta-form">Sección *</label>
            <select
              name="seccion"
              value={formulario.seccion}
              onChange={manejarCambio}
              required
              className="control-input"
            >
              <option value="A">Sección A (Aula 301)</option>
              <option value="B">Sección B (Aula 302)</option>
              <option value="C">Sección C (Aula 303)</option>
            </select>
          </div>

          <div className="campo-form">
            <label className="etiqueta-form">Estado Inicial</label>
            <input
              type="text"
              readOnly
              value={esEdicion ? matriculaAEditar.estado : 'Pendiente (Por Matricular)'}
              className="control-input input-bloqueado"
            />
          </div>
        </div>

        <div className="campo-form">
          <label className="etiqueta-form">Observaciones del Expediente</label>
          <textarea
            name="observacion"
            value={formulario.observacion}
            onChange={manejarCambio}
            rows={2}
            className="control-input"
            placeholder="Notas de recepción del expediente..."
          />
        </div>

        <div className="modal-acciones">
          <button type="button" onClick={alCerrar} className="btn-secundario" disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando ? 'Guardando...' : esEdicion ? 'Actualizar Expediente' : 'Registrar Matrícula'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
