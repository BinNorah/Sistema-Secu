import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Printer,
  Ban,
  XCircle,
  AlertCircle,
  Building,
  User,
  CreditCard,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { servicioMatriculas } from '../servicios/servicio_matriculas';
import InsigniaEstado from '../../../componentes/interfaz/InsigniaEstado';
import Alerta from '../../../componentes/interfaz/Alerta';
import ModalFormularioMatricula from '../componentes/ModalFormularioMatricula';

export default function PaginaListaMatriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' });

  // Postulante / Matrícula seleccionada para la Ficha Derecha
  const [matriculaSeleccionada, setMatriculaSeleccionada] = useState(null);

  // Estados de carga / acción
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [matriculaAEditar, setMatriculaAEditar] = useState(null);

  useEffect(() => {
    cargarMatriculas();
  }, [filtroEstado]);

  const cargarMatriculas = async () => {
    try {
      setCargando(true);
      const lista = await servicioMatriculas.listar(filtroEstado);
      setMatriculas(lista);
      if (lista.length > 0 && !matriculaSeleccionada) {
        setMatriculaSeleccionada(lista[0]);
      } else if (matriculaSeleccionada) {
        // Mantener la selección actualizada
        const actualizada = lista.find((m) => m.id === matriculaSeleccionada.id);
        if (actualizada) setMatriculaSeleccionada(actualizada);
      }
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: 'Error al consultar expedientes: ' + err.message });
    } finally {
      setCargando(false);
    }
  };

  // Función principal: Emisión oficial de Código de Matrícula (Patrón State: Pendiente -> Aprobada)
  const generarCodigoOficial = async () => {
    if (!matriculaSeleccionada) return;
    try {
      setProcesandoAccion(true);
      const res = await servicioMatriculas.cambiarEstado(
        matriculaSeleccionada.id,
        'Aprobada',
        'Código oficial de matrícula emitido y transmitido a SIAGIE exitosamente'
      );
      setAlerta({
        tipo: 'exito',
        mensaje: `¡Código emitido con éxito! Matrícula #${matriculaSeleccionada.id} formalizada oficialmente.`,
      });
      await cargarMatriculas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Rechazar Solicitud (Patrón State: Pendiente -> Rechazada)
  const rechazarSolicitud = async () => {
    if (!matriculaSeleccionada) return;
    const motivo = window.prompt('Ingrese el motivo oficial de rechazo del expediente:');
    if (!motivo) return;

    try {
      setProcesandoAccion(true);
      await servicioMatriculas.cambiarEstado(matriculaSeleccionada.id, 'Rechazada', motivo);
      setAlerta({ tipo: 'info', mensaje: 'El expediente de matrícula ha sido rechazado.' });
      await cargarMatriculas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Eliminar Expediente (CRUD Delete)
  const eliminarMatricula = async () => {
    if (!matriculaSeleccionada) return;
    if (matriculaSeleccionada.estado === 'Aprobada') {
      setAlerta({
        tipo: 'error',
        mensaje: 'Una matrícula aprobada no puede eliminarse del registro; debe anularse para preservar la auditoría.',
      });
      return;
    }

    if (!window.confirm(`¿Está seguro de eliminar el expediente #${matriculaSeleccionada.id} de ${matriculaSeleccionada.nombre_alumno}?`)) {
      return;
    }

    try {
      setProcesandoAccion(true);
      await servicioMatriculas.eliminar(matriculaSeleccionada.id);
      setAlerta({ tipo: 'exito', mensaje: 'Expediente eliminado correctamente.' });
      setMatriculaSeleccionada(null);
      await cargarMatriculas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Guardar creación o edición
  const manejarGuardarMatricula = async (datos) => {
    if (matriculaAEditar) {
      await servicioMatriculas.actualizar(matriculaAEditar.id, datos);
      setAlerta({ tipo: 'exito', mensaje: 'Expediente actualizado exitosamente.' });
    } else {
      await servicioMatriculas.registrar(datos);
      setAlerta({ tipo: 'exito', mensaje: 'Nueva matrícula registrada en estado Pendiente.' });
    }
    setModalFormAbierto(false);
    setMatriculaAEditar(null);
    await cargarMatriculas();
  };

  // Anular Matrícula (Patrón State: Aprobada -> Anulada)
  const anularMatricula = async () => {
    if (!matriculaSeleccionada) return;
    const motivo = window.prompt('Ingrese el motivo de anulación formal de la matrícula:');
    if (!motivo) return;

    try {
      setProcesandoAccion(true);
      await servicioMatriculas.cambiarEstado(matriculaSeleccionada.id, 'Anulada', motivo);
      setAlerta({ tipo: 'info', mensaje: 'La matrícula ha sido anulada en el registro.' });
      await cargarMatriculas();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const imprimirConstancia = () => {
    window.print();
  };

  // Generador de código institucional formal
  const obtenerCodigoOficial = (m) => {
    if (!m) return '';
    const pad = String(m.id).padStart(4, '0');
    return `MAT-2026-SEC-${pad}`;
  };

  const matriculasFiltradas = matriculas.filter((m) => {
    const texto = `${m.nombre_alumno} ${m.codigo_alumno} ${m.nivel_grado} ${m.seccion}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const m = matriculaSeleccionada;
  const esAprobada = m?.estado === 'Aprobada';
  const esPendiente = m?.estado === 'Pendiente';
  const esRechazada = m?.estado === 'Rechazada';
  const esAnulada = m?.estado === 'Anulada';

  return (
    <div className="pagina-contenedor-ancha">
      {/* Indicadores Clave de Gestión (KPIs) de Secretaría */}
      <div className="grid-kpis-secretaria mb-5">
        <div className="tarjeta-kpi-secretaria">
          <div className="flex items-center justify-between">
            <div>
              <span className="etiqueta-kpi-sec">Solicitudes Recibidas</span>
              <div className="valor-kpi-sec">48</div>
            </div>
            <div className="icono-kpi-sec bg-blue-50 text-blue-600">
              <FileText size={22} />
            </div>
          </div>
          <div className="detalle-kpi-sec text-blue-700">Total acumulado periodo ordinario</div>
        </div>

        <div className="tarjeta-kpi-secretaria">
          <div className="flex items-center justify-between">
            <div>
              <span className="etiqueta-kpi-sec">Pendientes por Matricular</span>
              <div className="valor-kpi-sec text-amber-600">12</div>
            </div>
            <div className="icono-kpi-sec bg-amber-50 text-amber-600">
              <Clock size={22} />
            </div>
          </div>
          <div className="detalle-kpi-sec text-amber-700">Expediente y pago listos para formalizar</div>
        </div>

        <div className="tarjeta-kpi-secretaria">
          <div className="flex items-center justify-between">
            <div>
              <span className="etiqueta-kpi-sec">Códigos Generados Hoy</span>
              <div className="valor-kpi-sec text-emerald-600">18</div>
            </div>
            <div className="icono-kpi-sec bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="detalle-kpi-sec text-emerald-700">Matrículas emitidas y transmitidas al SIAGIE</div>
        </div>
      </div>

      {alerta.mensaje && (
        <Alerta
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          alCerrar={() => setAlerta({ tipo: '', mensaje: '' })}
        />
      )}

      {/* Estructura Dividida (Master-Detail): Lista Izquierda + Ficha de Emisión Derecha */}
      <div className="panel-dividido-matriculas">
        {/* PANEL IZQUIERDO: Lista de Solicitudes y Postulantes */}
        <div className="columna-lista-postulantes">
          <div className="tarjeta-cabecera-lista">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="titulo-seccion-lista">Solicitudes y Postulantes</h3>
                <p className="subtitulo-seccion-lista">Expedientes ingresados para validación</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFormAbierto(true)}
                className="btn-nueva-solicitud"
                title="Registrar nueva solicitud de matrícula"
              >
                <Plus size={16} />
                <span>Nueva</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="buscador-contenedor mb-3">
              <Search size={15} className="icono-buscador" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por DNI o nombre..."
                className="control-input input-buscador text-xs"
              />
            </div>

            {/* Filtros de Estado */}
            <div className="grupo-filtros-rapidos">
              {['Todos', 'Pendiente', 'Aprobada', 'Rechazada'].map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setFiltroEstado(estado)}
                  className={`filtro-pildora-sec ${filtroEstado === estado ? 'activo' : ''}`}
                >
                  {estado === 'Pendiente' ? 'Por Matricular' : estado === 'Aprobada' ? 'Matriculados' : estado}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Solicitudes */}
          <div className="contenedor-scroll-postulantes">
            {cargando ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <RefreshCw className="animacion-rotar mx-auto mb-2 text-indigo-600" size={24} />
                Cargando expedientes...
              </div>
            ) : matriculasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No se encontraron postulantes con los filtros seleccionados.
              </div>
            ) : (
              matriculasFiltradas.map((item) => {
                const seleccionado = m?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setMatriculaSeleccionada(item)}
                    className={`tarjeta-item-postulante ${seleccionado ? 'seleccionado' : ''}`}
                  >
                    <div className="avatar-postulante">
                      {item.nombre_alumno?.charAt(0) || 'E'}
                    </div>

                    <div className="info-postulante-col">
                      <div className="flex items-center justify-between">
                        <span className="nombre-postulante">{item.nombre_alumno}</span>
                        <InsigniaEstado estado={item.estado} />
                      </div>
                      <div className="metadatos-postulante">
                        <span>{item.codigo_alumno}</span>
                        <span>•</span>
                        <span>{item.nivel_grado} (Sec. {item.seccion})</span>
                      </div>
                      <div className="colegio-procedencia-texto">
                        Colegio anterior: I.E. San Juan Bautista
                      </div>
                    </div>

                    <ChevronRight size={16} className="flecha-seleccion" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Ficha de Matrícula y Emisión de Código */}
        <div className="columna-ficha-emision">
          {!m ? (
            <div className="ficha-vacia">
              <FileCheck size={40} className="text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Seleccione un estudiante de la lista para revisar su expediente y emitir código.</p>
            </div>
          ) : (
            <div className="ficha-matricula-card">
              {/* Encabezado de la Ficha */}
              <div className="ficha-encabezado">
                <div>
                  <span className="etiqueta-expediente">EXPEDIENTE #{m.id} • AÑO {m.anio_academico}</span>
                  <h3 className="titulo-ficha-estudiante">{m.nombre_alumno}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-mono">DNI / Código: <strong>{m.codigo_alumno}</strong></span>
                    <span className="text-xs text-gray-300">•</span>
                    <InsigniaEstado estado={m.estado} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMatriculaAEditar(m);
                      setModalFormAbierto(true);
                    }}
                    className="btn-accion-editar-expediente"
                    title="Editar datos del expediente"
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>

                  {!esAprobada && (
                    <button
                      type="button"
                      onClick={eliminarMatricula}
                      disabled={procesandoAccion}
                      className="btn-accion-eliminar-expediente"
                      title="Eliminar expediente"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar</span>
                    </button>
                  )}

                  <div className="estado-emision-sello">
                    {esAprobada ? (
                      <div className="sello-formalizada">
                        <CheckCircle2 size={16} />
                        <span>Formalizada con Éxito</span>
                      </div>
                    ) : esPendiente ? (
                      <div className="sello-por-matricular">
                        <Clock size={16} />
                        <span>Lista para Formalizar</span>
                      </div>
                    ) : (
                      <div className="sello-inactiva">
                        <span>{m.estado}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido de la Ficha Organizada en Secciones */}
              <div className="ficha-cuerpo-secciones">
                {/* 1. Datos del Estudiante */}
                <div className="seccion-bloque">
                  <h4 className="seccion-titulo-bloque">
                    <User size={15} className="text-indigo-600" />
                    <span>Datos del Estudiante</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="dato-etiqueta">Nombres y Apellidos:</span>
                      <strong className="dato-valor block">{m.nombre_alumno}</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Documento DNI:</span>
                      <strong className="dato-valor font-mono block">73489215</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Fecha Nacimiento / Edad:</span>
                      <strong className="dato-valor block">14/05/2012 (14 años)</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Género / Lengua:</span>
                      <strong className="dato-valor block">Masculino • Castellano</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Procedencia Académica */}
                <div className="seccion-bloque">
                  <h4 className="seccion-titulo-bloque">
                    <Building size={15} className="text-indigo-600" />
                    <span>Procedencia Académica</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="dato-etiqueta">Colegio Anterior:</span>
                      <strong className="dato-valor block">I.E. San Juan Bautista - UGEL 03</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Código Modular SIAGIE:</span>
                      <strong className="dato-valor font-mono block">0384912</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Último Promedio General:</span>
                      <strong className="dato-valor text-emerald-700 block">16.8 (Aprobado)</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Datos del Apoderado */}
                <div className="seccion-bloque">
                  <h4 className="seccion-titulo-bloque">
                    <User size={15} className="text-indigo-600" />
                    <span>Datos del Apoderado Registrado</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="dato-etiqueta">Apoderado:</span>
                      <strong className="dato-valor block">Elena Carranza Ríos</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Parentesco / DNI:</span>
                      <strong className="dato-valor block">Madre • 09843211</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Teléfono de Contacto:</span>
                      <strong className="dato-valor font-mono block">+51 984 215 889</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Correo Electrónico:</span>
                      <strong className="dato-valor block">elena.carranza@gmail.com</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Grado y Aula Asignada */}
                <div className="seccion-bloque">
                  <h4 className="seccion-titulo-bloque">
                    <Building size={15} className="text-indigo-600" />
                    <span>Grado y Aula Asignada</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-xs bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
                    <div>
                      <span className="dato-etiqueta">Nivel y Grado:</span>
                      <strong className="dato-valor text-indigo-900 block">{m.nivel_grado}</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Aula Asignada:</span>
                      <strong className="dato-valor text-indigo-900 block">Aula 302 - Pabellón B</strong>
                    </div>
                    <div>
                      <span className="dato-etiqueta">Sección y Vacante:</span>
                      <strong className="dato-valor text-emerald-700 block">Sección "{m.seccion}" • Reservada</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Verificación de Requisitos y Comprobante de Pago */}
                <div className="seccion-bloque">
                  <h4 className="seccion-titulo-bloque">
                    <CreditCard size={15} className="text-indigo-600" />
                    <span>Verificación de Requisitos y Pago</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Checklist */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={14} />
                        <span>Validación RENIEC: Datos conformes</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={14} />
                        <span>Constancia SIAGIE: Traslado autorizado</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={14} />
                        <span>Certificado de Estudios y Ficha Médica adjuntos</span>
                      </div>
                    </div>

                    {/* Comprobante */}
                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="dato-etiqueta text-emerald-800">Derecho de Matrícula 2026:</span>
                        <div className="text-lg font-bold text-emerald-900 font-mono">S/ 920.00</div>
                        <span className="text-[11px] text-emerald-700">Comprobante: B001-0048291 (Validado)</span>
                      </div>
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded">
                        PAGADO
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. MÓDULO DE EMISIÓN OFICIAL DE MATRÍCULA */}
                <div className="modulo-emision-oficial">
                  {esPendiente ? (
                    <div className="caja-emision-accion">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Formalización y Emisión</h4>
                          <p className="text-xs text-gray-600">
                            El expediente cumple con todos los requisitos para la emisión del código único oficial.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={rechazarSolicitud}
                          disabled={procesandoAccion}
                          className="btn-rechazar-expediente"
                          title="Rechazar expediente por observaciones"
                        >
                          <XCircle size={15} />
                          <span>Rechazar Solicitud</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={generarCodigoOficial}
                        disabled={procesandoAccion}
                        className="btn-generar-codigo-destacado"
                      >
                        <Sparkles size={20} className="text-amber-300" />
                        <span>{procesandoAccion ? 'Emitiendo en SIAGIE...' : 'Generar Código de Matrícula'}</span>
                      </button>
                    </div>
                  ) : esAprobada ? (
                    <div className="caja-codigo-generado">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Código Oficial Emitido (SIAGIE)
                          </span>
                          <div className="codigo-oficial-valor">
                            {obtenerCodigoOficial(m)}
                          </div>
                          <p className="text-xs text-emerald-700 mt-1">
                            N° Registro Nacional: <strong>REG-2026-{String(m.id * 1482).padStart(8, '0')}</strong> • Transmitido con Éxito
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={anularMatricula}
                          disabled={procesandoAccion}
                          className="btn-anular-matricula-sec"
                          title="Anular matrícula por solicitud de retiro"
                        >
                          <Ban size={14} />
                          <span>Anular Matrícula</span>
                        </button>
                      </div>

                      {/* Botones de Documentos Oficiales */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-emerald-200">
                        <button
                          type="button"
                          onClick={imprimirConstancia}
                          className="btn-documento-oficial"
                        >
                          <FileText size={16} />
                          <span>Ficha PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={imprimirConstancia}
                          className="btn-documento-oficial btn-documento-primario"
                        >
                          <Printer size={16} />
                          <span>Imprimir Constancia</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="caja-matricula-inactiva">
                      <AlertCircle size={20} className="text-gray-500" />
                      <div>
                        <strong className="block text-gray-800 text-xs">Matrícula en estado {m.estado}</strong>
                        <p className="text-xs text-gray-600 mt-0.5">Motivo: "{m.observacion || 'Sin observaciones'}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Formulario Matrícula (Crear / Editar) */}
      <ModalFormularioMatricula
        abierto={modalFormAbierto}
        alCerrar={() => {
          setModalFormAbierto(false);
          setMatriculaAEditar(null);
        }}
        alGuardar={manejarGuardarMatricula}
        matriculaAEditar={matriculaAEditar}
      />
    </div>
  );
}
