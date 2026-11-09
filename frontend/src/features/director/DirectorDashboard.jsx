import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Layers, 
  Plus, 
  UserPlus, 
  CheckCircle, 
  RefreshCw, 
  LogOut, 
  School,
  Trash2,
  BookMarked,
  Search,
  GraduationCap,
  Building2
} from 'lucide-react';
import api from '../../api/client';

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'academic', 'assignments'
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'profesor',
  });

  // Academic state
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    teacher_id: '',
    subject_id: '',
    grade_level: '3° de Secundaria',
    section: 'A',
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
    loadAllData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [uRes, gRes, secRes, subRes, asgRes] = await Promise.all([
        api.get('/director/users'),
        api.get('/director/grades'),
        api.get('/director/sections'),
        api.get('/director/subjects'),
        api.get('/director/assignments'),
      ]);

      setUsers(uRes.data || []);
      setGrades(gRes.data || []);
      setSections(secRes.data || []);
      setSubjects(subRes.data || []);
      setAssignments(asgRes.data || []);
    } catch (err) {
      showToast('Error cargando información: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Toggle user active status
  const handleToggleUser = async (user) => {
    try {
      await api.patch(`/director/users/${user.id}/toggle`, {
        is_active: !user.is_active,
      });
      showToast(`Usuario ${user.username} ${!user.is_active ? 'activado' : 'desactivado'}`);
      loadAllData();
    } catch (err) {
      showToast('Error al actualizar estado: ' + err.message);
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/director/users', newUserForm);
      showToast('Usuario creado exitosamente');
      setShowNewUserModal(false);
      setNewUserForm({ username: '', full_name: '', email: '', password: '', role: 'profesor' });
      loadAllData();
    } catch (err) {
      showToast('Error al crear usuario: ' + err.message);
    }
  };

  // Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/director/subjects', newSubjectForm);
      showToast('Asignatura creada con éxito');
      setShowNewSubjectModal(false);
      setNewSubjectForm({ name: '', code: '', description: '' });
      loadAllData();
    } catch (err) {
      showToast('Error al crear asignatura: ' + err.message);
    }
  };

  // Assign Teacher
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    try {
      await api.post('/director/assignments', {
        teacher_id: parseInt(assignForm.teacher_id, 10),
        subject_id: parseInt(assignForm.subject_id, 10),
        grade_level: assignForm.grade_level,
        section: assignForm.section,
      });
      showToast('Asignación académica registrada');
      setShowAssignModal(false);
      loadAllData();
    } catch (err) {
      showToast('Error en asignación: ' + err.message);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('¿Está seguro de revocar esta asignación académica?')) return;
    try {
      await api.delete(`/director/assignments/${id}`);
      showToast('Asignación eliminada');
      loadAllData();
    } catch (err) {
      showToast('Error al eliminar asignación: ' + err.message);
    }
  };

  const teachers = users.filter((u) => u.role === 'profesor');
  const visibleUsers = users.filter((user) => {
    const query = userSearch.trim().toLocaleLowerCase();
    return !query || [user.username, user.full_name, user.email, user.role]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query));
  });

  return (
    <div className="dashboard-page min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Dirección · Gestión escolar
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Periodo Escolar 2026 • Director: <strong className="text-slate-700">{currentUser?.full_name || 'Dr. Roberto Carlos Salazar'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
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

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="dashboard-main flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <section className="dashboard-stats" aria-label="Resumen institucional">
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--purple"><Users size={18} /></span>
            <div><p>Cuentas registradas</p><strong>{users.length}</strong></div>
          </article>
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--green"><GraduationCap size={18} /></span>
            <div><p>Docentes</p><strong>{teachers.length}</strong></div>
          </article>
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--blue"><BookOpen size={18} /></span>
            <div><p>Asignaturas</p><strong>{subjects.length}</strong></div>
          </article>
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon dashboard-stat-icon--amber"><Building2 size={18} /></span>
            <div><p>Secciones</p><strong>{sections.length}</strong></div>
          </article>
        </section>

        {/* Navigation Tabs */}
        <nav className="dashboard-tabs" aria-label="Módulos de dirección">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'academic'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Oferta académica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Asignaciones</span>
          </button>
        </nav>

        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Cuentas y personal</h2>
                <p className="text-xs text-slate-500">Accesos, perfiles y estado de las cuentas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="dashboard-search">
                  <Search size={16} aria-hidden="true" />
                  <span className="sr-only">Buscar usuario</span>
                  <input
                    type="search"
                    placeholder="Buscar personal"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo usuario</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3">Correo Institucional</th>
                    <th className="py-2.5 px-3">Rol Asignado</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        {loading ? 'Cargando usuarios…' : users.length ? 'No hay resultados para la búsqueda.' : 'No hay usuarios registrados.'}
                      </td>
                    </tr>
                  ) : visibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-purple-700">
                        @{u.username}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {u.full_name}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'director'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'secretaria'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {u.is_active ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.id !== currentUser?.id ? (
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                              u.is_active
                                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sesión actual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMIC MANAGEMENT */}
        {activeTab === 'academic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grades & Sections */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <School className="w-4 h-4 text-purple-700" />
                <span>Grados y Secciones de Secundaria</span>
              </h2>

              <div className="space-y-3">
                {grades.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="font-bold text-slate-900 text-xs mb-1">{g.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {sections
                        .filter((s) => s.grade_level_id === g.id)
                        .map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                          >
                            <strong>Sección {s.name}</strong> • {s.classroom}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-700" />
                  <span>Malla Curricular / Asignaturas</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewSubjectModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 cursor-pointer"
                >
                  + Asignatura
                </button>
              </div>

              <div className="space-y-2.5">
                {subjects.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{sub.name}</div>
                      <div className="text-[11px] text-slate-500">{sub.description}</div>
                    </div>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {sub.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEACHER ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Asignaciones Académicas</h2>
                <p className="text-xs text-slate-500">Docentes a cargo de cada asignatura, grado y sección</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar Profesor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Profesor Docente</th>
                    <th className="py-2.5 px-3">Asignatura</th>
                    <th className="py-2.5 px-3">Grado y Sección</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No hay asignaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-slate-900">{a.teacher_name}</strong>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-purple-700">{a.subject_name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{a.subject_code}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {a.grade_level} - Sección "{a.section}"
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar asignación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: New User */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Registrar Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="Ej. Prof. Javier Mendoza"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Usuario *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  placeholder="ej. jmendoza"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="jmendoza@colegio.edu.pe"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol Asignado *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="profesor">Profesor (Docente de Aula)</option>
                  <option value="secretaria">Secretaría (Matrículas y Pagos)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Subject */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Crear Asignatura</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Asignatura *</label>
                <input
                  type="text"
                  required
                  value={newSubjectForm.name}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                  placeholder="Ej. Arte y Cultura"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código Modular *</label>
                <input
                  type="text"
                  required
                  value={newSubjectForm.code}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, code: e.target.value })}
                  placeholder="ART-SEC"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newSubjectForm.description}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, description: e.target.value })}
                  placeholder="Enfoque y contenidos del área..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800"
                >
                  Crear Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Teacher */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Asignar Docente a Clase</h3>
            <form onSubmit={handleAssignTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Profesor *</label>
                <select
                  required
                  value={assignForm.teacher_id}
                  onChange={(e) => setAssignForm({ ...assignForm, teacher_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">-- Seleccionar Docente --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} (@{t.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asignatura *</label>
                <select
                  required
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">-- Seleccionar Asignatura --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grado *</label>
                  <select
                    value={assignForm.grade_level}
                    onChange={(e) => setAssignForm({ ...assignForm, grade_level: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="1° de Secundaria">1° de Secundaria</option>
                    <option value="2° de Secundaria">2° de Secundaria</option>
                    <option value="3° de Secundaria">3° de Secundaria</option>
                    <option value="4° de Secundaria">4° de Secundaria</option>
                    <option value="5° de Secundaria">5° de Secundaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sección *</label>
                  <select
                    value={assignForm.section}
                    onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                    <option value="C">Sección C</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
