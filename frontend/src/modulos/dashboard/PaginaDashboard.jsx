import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Award, Clock, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import clienteAPI from '../../api/cliente_api';
import InsigniaEstado from '../../componentes/interfaz/InsigniaEstado';

export default function PaginaDashboard() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [ultimasMatriculas, setUltimasMatriculas] = useState([]);
  const [ultimasNotas, setUltimasNotas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resDashboard, resMatriculas, resNotas] = await Promise.all([
        clienteAPI.get('/dashboard'),
        clienteAPI.get('/matriculas'),
        clienteAPI.get('/notas'),
      ]);
      setEstadisticas(resDashboard.datos);
      setUltimasMatriculas((resMatriculas.datos || []).slice(0, 5));
      setUltimasNotas((resNotas.datos || []).slice(0, 5));
    } catch (err) {
      console.error('Error al cargar datos del panel:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-encabezado">
        <div>
          <h2 className="pagina-titulo">Panel de Control</h2>
          <p className="pagina-subtitulo">
            Resumen general del estado de matrículas y rendimiento académico del año escolar.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/matriculas" className="btn-secundario flex items-center gap-1.5">
            <UserCheck size={16} />
            <span>Ver Matrículas</span>
          </Link>
          <Link to="/notas" className="btn-primario flex items-center gap-1.5">
            <Award size={16} />
            <span>Ver Calificaciones</span>
          </Link>
        </div>
      </div>

      {/* Indicadores Clave (KPIs) */}
      <div className="grid-indicadores">
        <div className="tarjeta-kpi">
          <div className="flex items-center justify-between">
            <div>
              <span className="kpi-etiqueta">Total Matrículas</span>
              <div className="kpi-valor">{cargando ? '...' : estadisticas?.matriculas_total ?? 0}</div>
            </div>
            <div className="kpi-icono bg-indigo-50 text-indigo-600">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="kpi-detalle text-gray-500">
            Estudiantes registrados en el sistema
          </div>
        </div>

        <div className="tarjeta-kpi">
          <div className="flex items-center justify-between">
            <div>
              <span className="kpi-etiqueta">Matrículas Pendientes</span>
              <div className="kpi-valor text-amber-600">
                {cargando ? '...' : estadisticas?.matriculas_pendientes ?? 0}
              </div>
            </div>
            <div className="kpi-icono bg-amber-50 text-amber-600">
              <Clock size={22} />
            </div>
          </div>
          <div className="kpi-detalle text-amber-700">
            Expedientes por evaluar y dictaminar
          </div>
        </div>

        <div className="tarjeta-kpi">
          <div className="flex items-center justify-between">
            <div>
              <span className="kpi-etiqueta">Matrículas Aprobadas</span>
              <div className="kpi-valor text-emerald-600">
                {cargando ? '...' : estadisticas?.matriculas_aprobadas ?? 0}
              </div>
            </div>
            <div className="kpi-icono bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="kpi-detalle text-emerald-700">
            Estudiantes con matrícula activa
          </div>
        </div>

        <div className="tarjeta-kpi">
          <div className="flex items-center justify-between">
            <div>
              <span className="kpi-etiqueta">Calificaciones Registradas</span>
              <div className="kpi-valor text-purple-600">
                {cargando ? '...' : estadisticas?.notas_total ?? 0}
              </div>
            </div>
            <div className="kpi-icono bg-purple-50 text-purple-600">
              <Award size={22} />
            </div>
          </div>
          <div className="kpi-detalle text-purple-700">
            Evaluaciones con historial de versiones
          </div>
        </div>
      </div>

      {/* Tablas Resumen de los 2 CRUDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Matrículas */}
        <div className="tarjeta-tabla p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Últimas Matrículas Registradas</h3>
              <p className="text-xs text-gray-500">Expedientes más recientes</p>
            </div>
            <Link to="/matriculas" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Gestionar</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {ultimasMatriculas.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No hay registros de matrícula.</p>
          ) : (
            <div className="tabla-responsive">
              <table className="tabla-sistema text-xs">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Grado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasMatriculas.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="font-semibold text-gray-900">{m.nombre_alumno}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{m.codigo_alumno}</div>
                      </td>
                      <td className="text-gray-700">{m.nivel_grado} ({m.seccion})</td>
                      <td>
                        <InsigniaEstado estado={m.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimas Calificaciones */}
        <div className="tarjeta-tabla p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Últimas Calificaciones</h3>
              <p className="text-xs text-gray-500">Notas y evaluaciones recientes</p>
            </div>
            <Link to="/notas" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>Gestionar</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {ultimasNotas.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No hay notas registradas.</p>
          ) : (
            <div className="tabla-responsive">
              <table className="tabla-sistema text-xs">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Asignatura</th>
                    <th>Nota</th>
                    <th>Versión</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasNotas.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <div className="font-semibold text-gray-900">{n.nombre_alumno}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{n.codigo_alumno}</div>
                      </td>
                      <td className="font-medium text-gray-800">{n.asignatura}</td>
                      <td>
                        <span className={`nota-valor-badge text-xs ${n.calificacion >= 11 ? 'nota-aprobada' : 'nota-desaprobada'}`}>
                          {Number(n.calificacion).toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className="badge-version-actual text-xs">v{n.version_actual}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
