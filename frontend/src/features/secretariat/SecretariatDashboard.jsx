import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  AlertTriangle, 
  Search, 
  CreditCard, 
  Check, 
  FileText, 
  User, 
  School, 
  LogOut,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import api, { API_BASE_URL } from '../../api/client';

export default function SecretariatDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, observed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Modals
  const [showObserveModal, setShowObserveModal] = useState(false);
  const [observeReason, setObserveReason] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [voucherNumber, setVoucherNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (error) {
        console.error('No se pudo leer el usuario guardado.', error);
        localStorage.removeItem('user');
      }
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/enrollments/stats'),
      ]);

      const list = Array.isArray(listRes.data) ? listRes.data : [];
      const totals = statsRes.data || {};
      setEnrollments(list);
      setStats({
        total: totals.Total ?? list.length,
        pending: totals.Pendiente ?? list.filter((item) => item.status?.toLowerCase() === 'pendiente').length,
        approved: totals.Aprobada ?? list.filter((item) => item.status?.toLowerCase() === 'aprobada').length,
        observed: totals.Observada ?? list.filter((item) => item.status?.toLowerCase() === 'observada').length,
      });

      // Keep selected or pick first
      if (list.length > 0) {
        if (!selectedEnrollment) {
          setSelectedEnrollment(list[0]);
        } else {
          const fresh = list.find((e) => e.id === selectedEnrollment.id);
          setSelectedEnrollment(fresh || list[0]);
        }
      } else {
        setSelectedEnrollment(null);
      }
    } catch (err) {
      showToast('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // State pattern transition: Approve
  const handleApprove = async () => {
    if (!selectedEnrollment) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/enrollments/${selectedEnrollment.id}/state`, {
        status: 'Aprobada',
        reason: 'Expediente formalizado y verificado por secretaría',
      });
      showToast(res.message || 'Matrícula formalizada con éxito (Patrón State)');
      await loadData();
    } catch (err) {
      showToast('Error al aprobar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // State pattern transition: Observe
  const handleConfirmObserve = async () => {
    if (!selectedEnrollment) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/enrollments/${selectedEnrollment.id}/state`, {
        status: 'Observada',
        reason: observeReason || 'Documentación o requisitos incompletos',
      });
      showToast(res.message || 'Matrícula observada');
      setShowObserveModal(false);
      setObserveReason('');
      await loadData();
    } catch (err) {
      showToast('Error al observar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // State pattern transition: Reopen to Pending
  const handleReopen = async () => {
    if (!selectedEnrollment) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/enrollments/${selectedEnrollment.id}/state`, {
        status: 'Pendiente',
        reason: 'Reabierta para nueva evaluación',
      });
      showToast(res.message || 'Matrícula reabierta a Pendiente');
      await loadData();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Record Payment
  const handleConfirmPayment = async () => {
    if (!selectedEnrollment) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/enrollments/${selectedEnrollment.id}/payment`, {
        voucher_number: voucherNumber || `B001-${Math.floor(1000000 + Math.random() * 9000000)}`,
        amount: 920.00,
      });
      showToast(res.message || 'Pago registrado exitosamente');
      setShowPaymentModal(false);
      setVoucherNumber('');
      await loadData();
    } catch (err) {
      showToast('Error registrando pago: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredList = enrollments.filter((item) => {
    const studentName = item.student ? item.student.full_name?.toLowerCase() : '';
    const studentDni = item.student ? item.student.dni : '';
    const code = item.code?.toLowerCase() || '';
    const matchesSearch =
      studentName.includes(search.toLowerCase()) ||
      studentDni.includes(search) ||
      code.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-page min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Secretaría · Matrículas
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Año Académico 2026 • Operador: <strong className="text-slate-700">{currentUser?.full_name || 'Lic. Carmen Rosa Mendoza'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
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
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Solicitudes Recibidas
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total || enrollments.length}</div>
            <span className="text-[11px] text-slate-400">Total acumulado periodo 2026</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Por Matricular
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.pending || 0}</div>
            <span className="text-[11px] text-slate-400">Pendientes de evaluación</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Formalizadas SIAGIE
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.approved || 0}</div>
            <span className="text-[11px] text-slate-400">Códigos oficiales emitidos</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Observadas
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600">{stats.observed || 0}</div>
            <span className="text-[11px] text-slate-400">Expedientes con requisitos pendientes</span>
          </div>
        </div>

        {/* Workspace: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List & Filters (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por DNI o Nombres..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({enrollments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Pendiente')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'Pendiente' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Aprobada')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'Aprobada' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aprobadas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Observada')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'Observada' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Observadas
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Estudiante</th>
                    <th className="py-2.5 px-3">Grado</th>
                    <th className="py-2.5 px-3">Pago</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron solicitudes registradas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const isSelected = selectedEnrollment?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedEnrollment(item)}
                          className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/80 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">
                            {item.code}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">
                              {item.student ? item.student.full_name : 'Sin alumno'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              DNI: {item.student?.dni}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">
                            {item.grade_level} ({item.section})
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.payment_status === 'Pagado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                item.status === 'Aprobada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Observada'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 p-1 font-semibold"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Ficha de Matrícula y Emisión de Código (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            {selectedEnrollment ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Expediente Académico
                    </span>
                    <h2 className="text-xl font-black text-slate-900 font-mono">
                      {selectedEnrollment.code}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedEnrollment.status === 'Aprobada'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedEnrollment.status === 'Observada'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Estado: {selectedEnrollment.status}
                  </span>
                </div>

                {/* Student Info Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Datos del Postulante</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nombres y Apellidos</span>
                      <strong className="text-slate-900 text-xs">{selectedEnrollment.student?.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DNI</span>
                      <strong className="text-slate-900 font-mono text-xs">{selectedEnrollment.student?.dni}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fecha Nacimiento</span>
                      <span className="text-slate-800">{selectedEnrollment.student?.birth_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Grado y Sección</span>
                      <strong className="text-blue-700">{selectedEnrollment.grade_level} - Sec "{selectedEnrollment.section}"</strong>
                    </div>
                  </div>
                </div>

                {/* Guardian Info Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Datos del Apoderado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Apoderado</span>
                      <strong className="text-slate-900 text-xs">{selectedEnrollment.guardian?.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Parentesco</span>
                      <span className="text-slate-800">{selectedEnrollment.guardian?.relationship}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Teléfono Móvil</span>
                      <span className="text-slate-800 font-mono">{selectedEnrollment.guardian?.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Correo</span>
                      <span className="text-slate-800 truncate block">{selectedEnrollment.guardian?.email || 'No registrado'}</span>
                    </div>
                  </div>
                </div>

                {/* Document & Payment Verification */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Boleta de Notas</div>
                        <div className="text-[11px] text-slate-500">Expediente del colegio anterior</div>
                      </div>
                    </div>

                    {selectedEnrollment.report_card_url ? (
                      <a
                        href={`${API_BASE_URL}${selectedEnrollment.report_card_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Documento</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No adjuntado</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Comprobante de Pago: S/ {selectedEnrollment.payment_amount.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Estado: <strong className={selectedEnrollment.payment_status === 'Pagado' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            {selectedEnrollment.payment_status}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {selectedEnrollment.payment_status !== 'Pagado' && (
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        Registrar Pago
                      </button>
                    )}
                  </div>
                </div>

                {/* Observation Notes */}
                {selectedEnrollment.observation && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block mb-0.5">Observación registrada:</span>
                    {selectedEnrollment.observation}
                  </div>
                )}

                {/* State Pattern Action Module */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Acciones de Secretaría (Control de Estado)
                  </span>

                  {selectedEnrollment.status !== 'Aprobada' ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      <span>Generar Código Oficial de Matrícula (Aprobar)</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Matrícula Formalizada con Código SIAGIE Oficial</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {selectedEnrollment.status !== 'Observada' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => setShowObserveModal(true)}
                        className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Observar Matrícula
                      </button>
                    )}

                    {selectedEnrollment.status === 'Observada' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleReopen}
                        className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Reabrir a Pendiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-sm">
                Selecciona una solicitud de la lista para gestionar su matrícula.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Observe Modal */}
      {showObserveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Observar Solicitud de Matrícula</h3>
            <p className="text-xs text-slate-500">
              Indique el motivo por el cual la solicitud no cumple con los requisitos para que el apoderado subsane.
            </p>
            <textarea
              rows={3}
              required
              value={observeReason}
              onChange={(e) => setObserveReason(e.target.value)}
              placeholder="Ej: Boleta de notas borrosa o falta constancia de no adeudo..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowObserveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmObserve}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                Confirmar Observación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Registrar Pago de Matrícula</h3>
            <p className="text-xs text-slate-500">
              Monto a registrar: <strong>S/ 920.00</strong> correspondiente al periodo 2026.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° de Boleta / Voucher de Pago
              </label>
              <input
                type="text"
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="Ej. B001-0048291"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
