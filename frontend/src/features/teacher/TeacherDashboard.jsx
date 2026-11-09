import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  RotateCcw, 
  RotateCw, 
  History, 
  Save, 
  CheckCircle, 
  RefreshCw, 
  LogOut, 
  Check,
  Search,
  Users,
  ChartNoAxesColumnIncreasing,
  TriangleAlert
} from 'lucide-react';
import api from '../../api/client';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Edit / Input state for the selected student
  const [editForm, setEditForm] = useState({
    b1: 0,
    b2: 0,
    b3: 0,
    b4: 0,
    observation: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('No se pudo leer el usuario guardado.', error);
        localStorage.removeItem('user');
      }
    }
    loadGrades();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const res = await api.get('/grades');
      const list = res.data || [];
      setGrades(list);
      if (list.length > 0) {
        if (!selectedGrade) {
          selectGradeItem(list[0]);
        } else {
          const fresh = list.find((g) => g.id === selectedGrade.id);
          selectGradeItem(fresh || list[0]);
        }
      }
    } catch (err) {
      showToast('Error cargando calificaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectGradeItem = (item) => {
    setSelectedGrade(item);
    setEditForm({
      b1: item.b1,
      b2: item.b2,
      b3: item.b3,
      b4: item.b4,
      observation: item.observation || '',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Save changes (creates Memento snapshot)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedGrade) return;

    // Validate 0 to 20
    const b1 = parseFloat(editForm.b1) || 0;
    const b2 = parseFloat(editForm.b2) || 0;
    const b3 = parseFloat(editForm.b3) || 0;
    const b4 = parseFloat(editForm.b4) || 0;

    if ([b1, b2, b3, b4].some((v) => v < 0 || v > 20)) {
      showToast('Las notas deben estar entre 0 y 20');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/grades', {
        student_id: selectedGrade.student_id,
        subject_id: selectedGrade.subject_id,
        grade_level: selectedGrade.grade_level,
        section: selectedGrade.section,
        b1,
        b2,
        b3,
        b4,
        observation: editForm.observation,
      });

      showToast(res.message || 'Nota actualizada y versión guardada en SQLite (Memento)');
      await loadGrades();
    } catch (err) {
      showToast('Error al guardar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Memento: Undo
  const handleUndo = async () => {
    if (!selectedGrade) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/grades/${selectedGrade.id}/undo`);
      showToast(res.message || 'Deshecho a la versión previa (Memento)');
      await loadGrades();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Memento: Redo
  const handleRedo = async () => {
    if (!selectedGrade) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/grades/${selectedGrade.id}/redo`);
      showToast(res.message || 'Rehecho a la versión posterior (Memento)');
      await loadGrades();
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Memento: View History
  const handleOpenHistory = async () => {
    if (!selectedGrade) return;
    try {
      setActionLoading(true);
      const res = await api.get(`/grades/${selectedGrade.id}/history`);
      setHistoryData(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      showToast('Error obteniendo historial: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Memento: Restore Specific Version
  const handleRestoreVersion = async (mementoId) => {
    if (!selectedGrade) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/grades/${selectedGrade.id}/restore/${mementoId}`);
      showToast(res.message || 'Versión restaurada con éxito (Memento)');
      setShowHistoryModal(false);
      await loadGrades();
    } catch (err) {
      showToast('Error al restaurar versión: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const calculatedAvg = (
    (parseFloat(editForm.b1 || 0) +
      parseFloat(editForm.b2 || 0) +
      parseFloat(editForm.b3 || 0) +
      parseFloat(editForm.b4 || 0)) /
    4
  ).toFixed(1);
  const visibleGrades = grades.filter((grade) => {
    const query = studentSearch.trim().toLocaleLowerCase();
    return !query || [
      grade.student_name,
      grade.student_dni,
      grade.subject_name,
      grade.grade_level,
      grade.section,
    ].some((value) => String(value || '').toLocaleLowerCase().includes(query));
  });
  const classAverage = grades.length
    ? (grades.reduce((sum, grade) => sum + Number(grade.average || 0), 0) / grades.length).toFixed(1)
    : '—';
  const studentsBelowPassing = grades.filter((grade) => Number(grade.average || 0) < 11).length;

  return (
    <div className="dashboard-page min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Docencia · Calificaciones
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Periodo Escolar 2026 • Docente: <strong className="text-slate-700">{currentUser?.full_name || 'Prof. Manuel Alejandro Castro'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadGrades}
            title="Recargar datos"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="dashboard-main flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <section className="dashboard-stats" aria-label="Resumen académico">
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--green"><Users size={18} /></span>
            <div><p>Estudiantes asignados</p><strong>{grades.length}</strong></div>
          </article>
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--blue"><ChartNoAxesColumnIncreasing size={18} /></span>
            <div><p>Promedio del grupo</p><strong>{classAverage}<small> / 20</small></strong></div>
          </article>
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--amber"><TriangleAlert size={18} /></span>
            <div><p>Requieren seguimiento</p><strong>{studentsBelowPassing}</strong></div>
          </article>
        </section>

        {/* Workspace: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List of Students / Grades (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Estudiantes Asignados</h2>
                <p className="text-xs text-slate-500">Consulta y seguimiento de calificaciones</p>
              </div>
              <label className="dashboard-search">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Buscar estudiante</span>
                <input
                  type="search"
                  placeholder="Buscar estudiante o curso"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Estudiante</th>
                    <th className="py-2.5 px-2 text-center">B1</th>
                    <th className="py-2.5 px-2 text-center">B2</th>
                    <th className="py-2.5 px-2 text-center">B3</th>
                    <th className="py-2.5 px-2 text-center">B4</th>
                    <th className="py-2.5 px-2 text-center">Prom</th>
                    <th className="py-2.5 px-3 text-center">Versión</th>
                    <th className="py-2.5 px-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleGrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        {loading ? 'Cargando estudiantes…' : grades.length ? 'No hay resultados para la búsqueda.' : 'No hay estudiantes asignados para mostrar.'}
                      </td>
                    </tr>
                  ) : visibleGrades.map((item) => {
                    const isSelected = selectedGrade?.id === item.id;
                    const isApproved = item.average >= 11;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => selectGradeItem(item)}
                        className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/80 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block">{item.student_name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">DNI: {item.student_dni}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-medium">{item.b1.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center font-mono font-medium">{item.b2.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center font-mono font-medium">{item.b3.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center font-mono font-medium">{item.b4.toFixed(1)}</td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                          {item.average.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                            v{item.current_version}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isApproved ? 'Aprobado' : 'En Proceso'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Grade Editor & Memento Undo/Redo/History (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            {selectedGrade ? (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Editando Calificación
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedGrade.student_name}
                    </h2>
                    <span className="text-xs text-slate-500">
                      {selectedGrade.subject_name} • {selectedGrade.grade_level} - "{selectedGrade.section}"
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                    Versión Actual: v{selectedGrade.current_version}
                  </span>
                </div>

                {/* 4 Bimesters Inputs (0 - 20) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Notas Bimestrales (Escala Vigesimal 0 - 20)
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">1° Bimestre</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={editForm.b1}
                        onChange={(e) => setEditForm({ ...editForm, b1: e.target.value })}
                        className="w-full py-2 text-center font-mono font-bold text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-slate-50"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">2° Bimestre</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={editForm.b2}
                        onChange={(e) => setEditForm({ ...editForm, b2: e.target.value })}
                        className="w-full py-2 text-center font-mono font-bold text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-slate-50"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">3° Bimestre</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={editForm.b3}
                        onChange={(e) => setEditForm({ ...editForm, b3: e.target.value })}
                        className="w-full py-2 text-center font-mono font-bold text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-slate-50"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">4° Bimestre</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={editForm.b4}
                        onChange={(e) => setEditForm({ ...editForm, b4: e.target.value })}
                        className="w-full py-2 text-center font-mono font-bold text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Average Live Preview */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block">Promedio Anual Calculado:</span>
                    <span className="text-[11px] text-slate-400">Escala de 0 a 20 (Aprobatorio: 11)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-mono text-slate-900 block">
                      {calculatedAvg}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        parseFloat(calculatedAvg) >= 11
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {parseFloat(calculatedAvg) >= 11 ? 'Condición: Aprobado' : 'Condición: Desaprobado'}
                    </span>
                  </div>
                </div>

                {/* Observation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observaciones Pedagógicas
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.observation}
                    onChange={(e) => setEditForm({ ...editForm, observation: e.target.value })}
                    placeholder="Desempeño en tareas, proyectos y participación..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Notas y Registrar Versión (Memento)</span>
                </button>

                {/* Memento Navigation Controls (Undo, Redo, History) */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Control de Versiones Históricas (Patrón Memento)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading || selectedGrade.current_version <= 1}
                      onClick={handleUndo}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Deshacer (Undo)</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRedo}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Rehacer (Redo)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleOpenHistory}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Ver Línea de Tiempo de Versiones (Historial)</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-20 text-center text-slate-400 text-sm">
                Selecciona un alumno de la lista para registrar o editar sus calificaciones.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* History Modal (Memento Caretaker Inspection) */}
      {showHistoryModal && historyData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <span>Historial de Versiones (Patrón Memento)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calificación ID: #{historyData.grade_id} • Versión activa: <strong>v{historyData.current_version}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {historyData.mementos && historyData.mementos.length > 0 ? (
                historyData.mementos.map((m) => {
                  const isCurrent = m.version === historyData.current_version;
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-800 text-white">
                            v{m.version}
                          </span>
                          <span className="font-semibold text-slate-700">
                            Acción: {m.action}
                          </span>
                        </div>

                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Versión Activa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(m.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Restaurar esta versión
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 font-mono text-center bg-slate-50 p-2 rounded-lg mb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">B1</span>
                          <strong className="text-slate-800">{m.b1.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">B2</span>
                          <strong className="text-slate-800">{m.b2.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">B3</span>
                          <strong className="text-slate-800">{m.b3.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">B4</span>
                          <strong className="text-slate-800">{m.b4.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">PROM</span>
                          <strong className="text-emerald-700 font-bold">{m.average.toFixed(1)}</strong>
                        </div>
                      </div>

                      {m.observation && (
                        <div className="text-[11px] text-slate-500 italic">
                          "{m.observation}"
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No hay instantáneas previas registradas.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
