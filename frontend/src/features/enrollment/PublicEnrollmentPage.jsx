import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  ChevronLeft,
  Send, 
  Building, 
  ShieldCheck, 
} from 'lucide-react';
import api from '../../api/client';

const initialForm = {
  student_names: '',
  student_surnames: '',
  student_dni: '',
  student_birth_date: '',
  grade_level: '3° de Secundaria',
  guardian_names: '',
  guardian_surnames: '',
  guardian_dni: '',
  guardian_phone: '',
  guardian_email: '',
  guardian_relationship: 'Madre',
};

export default function PublicEnrollmentPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const formRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const steps = ['Estudiante', 'Apoderado', 'Documento'];

  function goToNextStep(event) {
    event?.preventDefault();
    const requiredFields = [
      ['student_names', 'student_surnames', 'student_dni', 'student_birth_date'],
      ['guardian_names', 'guardian_surnames', 'guardian_dni', 'guardian_phone'],
    ][step] || [];

    const invalidField = requiredFields
      .map((name) => formRef.current?.elements.namedItem(name))
      .find((field) => field && !field.checkValidity());

    if (invalidField) {
      invalidField.reportValidity();
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (step < steps.length - 1) {
      goToNextStep();
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });
      if (file) {
        data.append('report_card', file);
      }

      const response = await api.post('/enrollments/public', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmittedData(response.data);
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud de matrícula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-enrollment-page min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="enrollment-container max-w-4xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inicio</span>
          </Link>

        </div>

        {/* Success Card when Submitted */}
        {submittedData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              Registro Conforme
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 mb-2">
              ¡Solicitud de Matrícula Recibida con Éxito!
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mb-8">
              La solicitud ha sido registrada en el sistema del colegio y se encuentra en estado inicial <strong className="text-amber-600 font-semibold">Pendiente</strong> para la revisión de secretaría académica.
            </p>

            {/* Generated Code Badge */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto mb-8">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block mb-1">
                Código Único de Solicitud
              </span>
              <span className="text-3xl font-mono font-black text-blue-700 tracking-wider block">
                {submittedData.code}
              </span>
              <div className="mt-4 pt-3 border-t border-blue-200/60 flex justify-between text-xs text-slate-600 font-medium">
                <span>Estado: <strong className="text-amber-600 font-bold">{submittedData.status}</strong></span>
                <span>Grado: <strong>{submittedData.grade_level}</strong></span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs text-slate-600 space-y-2 mb-8 max-w-lg mx-auto">
              <div className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Pasos siguientes del proceso:
              </div>
              <p>1. La Secretaría Institucional validará la boleta de notas y datos del alumno.</p>
              <p>2. Una vez validada, se generará el Código Oficial de Matrícula SIAGIE.</p>
              <p>3. El comprobante de pago de S/ 920.00 podrá ser regularizado en secretaría.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all"
              >
                Volver a la Página Principal
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedData(null);
                  setFile(null);
                  setForm(initialForm);
                  setStep(0);
                }}
                className="px-6 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm border border-blue-200 transition-all"
              >
                Registrar Otra Solicitud
              </button>
            </div>
          </div>
        ) : (
          /* Enrollment Form */
          <div className="enrollment-card bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Title Header */}
            <div className="enrollment-hero bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 text-white p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide uppercase mb-3">
                <Building className="w-3.5 h-3.5 text-blue-300" />
                Admisión Secundaria 2026
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ficha de Solicitud de Matrícula Escolar
              </h1>
              <p className="text-slate-300 text-sm mt-2 font-light">
                Por favor complete los datos del postulante y del apoderado legal. Adjunte la boleta de notas del año anterior para validación.
              </p>
              <div className="enrollment-progress" aria-label="Tres pasos para completar la solicitud">
                {steps.map((label, index) => (
                  <React.Fragment key={label}>
                    {index > 0 && <b className={index <= step ? 'is-complete' : ''} />}
                    <span
                      className={index === step ? 'is-current' : index < step ? 'is-complete' : ''}
                      aria-current={index === step ? 'step' : undefined}
                    >
                      <i>{index + 1}</i> {label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="enrollment-form p-8 sm:p-10">
              {/* Section 1: Datos del Estudiante */}
              {step === 0 && <div className="enrollment-step-panel" key="student">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Datos del Estudiante</h3>
                    <p className="text-xs text-slate-500">Información del alumno que cursará el nivel secundario</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      name="student_names"
                      required
                      value={form.student_names}
                      onChange={handleChange}
                      placeholder="Ej. Mateo Alejandro"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos Completos *</label>
                    <input
                      type="text"
                      name="student_surnames"
                      required
                      value={form.student_surnames}
                      onChange={handleChange}
                      placeholder="Ej. Villanueva Carranza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">DNI del Estudiante (8 dígitos) *</label>
                    <input
                      type="text"
                      name="student_dni"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      maxLength={8}
                      value={form.student_dni}
                      onChange={handleChange}
                      placeholder="73489215"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      name="student_birth_date"
                      required
                      value={form.student_birth_date}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Grado de Secundaria a Postular *</label>
                    <select
                      name="grade_level"
                      required
                      value={form.grade_level}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm font-medium bg-white"
                    >
                      <option value="1° de Secundaria">1° de Secundaria (Aulas 101 - 102)</option>
                      <option value="2° de Secundaria">2° de Secundaria (Aulas 201 - 202)</option>
                      <option value="3° de Secundaria">3° de Secundaria (Aulas 301 - 302)</option>
                      <option value="4° de Secundaria">4° de Secundaria (Aulas 401 - 402)</option>
                      <option value="5° de Secundaria">5° de Secundaria (Aulas 501 - 502)</option>
                    </select>
                  </div>
                </div>
              </div>}

              {/* Section 2: Datos del Apoderado */}
              {step === 1 && <div className="enrollment-step-panel" key="guardian">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Datos del Apoderado</h3>
                    <p className="text-xs text-slate-500">Padre, madre o tutor legal responsable</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres del Apoderado *</label>
                    <input
                      type="text"
                      name="guardian_names"
                      required
                      value={form.guardian_names}
                      onChange={handleChange}
                      placeholder="Ej. Elena Patricia"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos del Apoderado *</label>
                    <input
                      type="text"
                      name="guardian_surnames"
                      required
                      value={form.guardian_surnames}
                      onChange={handleChange}
                      placeholder="Ej. Carranza Ríos"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">DNI del Apoderado *</label>
                    <input
                      type="text"
                      name="guardian_dni"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      maxLength={8}
                      value={form.guardian_dni}
                      onChange={handleChange}
                      placeholder="09843211"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parentesco *</label>
                    <select
                      name="guardian_relationship"
                      required
                      value={form.guardian_relationship}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm bg-white"
                    >
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Tutor Legal">Tutor Legal / Apoderado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="tel"
                      name="guardian_phone"
                      required
                      value={form.guardian_phone}
                      onChange={handleChange}
                      placeholder="984215889"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      name="guardian_email"
                      value={form.guardian_email}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-sm"
                    />
                  </div>
                </div>
              </div>}

              {/* Section 3: Subida de Boleta de Notas */}
              {step === 2 && <div className="enrollment-step-panel" key="document">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Documento Académico</h3>
                    <p className="text-xs text-slate-500">Boleta de notas o certificado de estudios del colegio de procedencia</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    {file ? file.name : 'Arrastra o selecciona el archivo de la boleta de notas'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Formatos admitidos: PDF, JPG, PNG (Máximo 10 MB)</p>
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 border border-slate-300 hover:bg-slate-50 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Seleccionar Documento</span>
                  </label>
                </div>
              </div>}

              <div className="enrollment-step-actions">
                {step > 0 ? (
                  <button type="button" className="enrollment-back-button" onClick={() => { setError(null); setStep((current) => current - 1); }}>
                    <ChevronLeft size={17} /> Anterior
                  </button>
                ) : <span className="enrollment-step-spacer" aria-hidden="true" />}
                <span className="enrollment-step-hint">Paso {step + 1} de 3 · {steps[step]}</span>
                {step < steps.length - 1 ? (
                  <button type="button" className="enrollment-next-button" onClick={(event) => goToNextStep(event)}>
                    Continuar <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="enrollment-next-button"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Enviando solicitud…' : 'Enviar solicitud'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
