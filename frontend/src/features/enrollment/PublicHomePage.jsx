import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SchoolModal from '../../components/school/SchoolModal';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Laptop, 
  FileCheck,
  Building2,
  Clock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const copyrightYear = new Date().getFullYear();

export default function PublicHomePage() {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <div className="public-home-page min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section className="home-hero relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Admisión y Matrícula Abierta 2026
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Formando líderes con excelencia científica y valores humanos
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-light">
                Educación Secundaria integral de 1° a 5° año. Innovación pedagógica, laboratorios de ciencias, robótica y preparación preuniversitaria personalizada.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/matricula"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
                >
                  <FileCheck className="w-5 h-5 text-emerald-300" />
                  <span>Iniciar Matrícula Online</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-base border border-slate-700 backdrop-blur-xs transition-all"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Portal Institucional</span>
                </Link>
              </div>
              <div className="home-highlights">
                <span><strong>1°–5°</strong><small>Secundaria</small></span>
                <i />
                <span><strong>4</strong><small>periodos académicos</small></span>
                <i />
                <span><strong>2026</strong><small>admisión abierta</small></span>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/15 shadow-2xl text-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
                    <Building2 className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Periodo Académico 2026</h3>
                    <p className="text-xs text-slate-300">Colegio Secundario San Juan Bautista</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Solicitud digital</span>
                      <span className="text-slate-300 text-xs">Completa los datos del estudiante y su apoderado desde el formulario.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Revisión por Secretaría</span>
                      <span className="text-slate-300 text-xs">El equipo revisa los documentos y actualiza el estado de la solicitud.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Acompañamiento Docente</span>
                      <span className="text-slate-300 text-xs">Seguimiento bimestral de notas (B1 a B4) y evaluación continua.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" /> Atención Secretaría: 8:00 AM - 4:00 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Levels & Academic Areas */}
      <section className="home-academics py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Nuestra Propuesta Pedagógica
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Plan Curricular de Secundaria
          </h2>
          <p className="text-slate-600 mt-4 text-base">
            Diseñado para potenciar el razonamiento lógico-matemático, la competencia comunicativa y el pensamiento crítico en cada uno de los 5 grados de secundaria.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Ciencias y Matemáticas</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Álgebra, Geometría, Trigonometría, Física, Química y Biología con sesiones prácticas en laboratorio escolar.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Laboratorio de Ciencias equipado</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolución de problemas tipo pre</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Humanidades e Idiomas</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Comunicación integral, Ciencias Sociales, Desarrollo Personal, Ciudadanía e Inglés intensivo con enfoque comunicativo.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Talleres de oratoria y debate</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Nivel de inglés A2 - B1 progresivo</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Valores y Liderazgo</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Orientación vocacional temprana desde 3° de secundaria, tutoría personalizada y programas de convivencia pacífica.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Test vocacional en 4° y 5° año</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Escuela para padres continua</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Online Registration CTA Banner */}
      <section className="home-cta bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ¿Listo para asegurar la vacante de tu menor hijo?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto text-base font-light">
            Completa la solicitud de matrícula en línea en solo 3 minutos. Nuestro equipo de secretaría revisará tu expediente y te asignará el código oficial de matrícula.
          </p>
          <div className="pt-2">
            <Link
              to="/matricula"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-800 font-bold text-base hover:bg-blue-50 shadow-xl transition-transform hover:scale-105"
            >
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Llenar Formulario de Matrícula 2026</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-main">
          <div className="home-footer-brand">
            <Link to="/" className="home-footer-logo">
              <span><GraduationCap size={21} /></span>
              <span><strong>San Juan Bautista</strong><small>Educación secundaria</small></span>
            </Link>
            <p>Formamos estudiantes con pensamiento crítico, conocimientos sólidos y valores para construir su futuro.</p>
            <span className="home-footer-year"><i /> Admisión y periodo académico 2026</span>
          </div>

          <div className="home-footer-column home-footer-terms">
            <h2>Información del portal</h2>
            <p>Condiciones para utilizar los servicios digitales y enviar solicitudes de matrícula al colegio.</p>
            <button type="button" onClick={() => setTermsOpen(true)}>
              Términos y condiciones <ArrowRight size={14} />
            </button>
            <span className="home-footer-highlight"><ShieldCheck size={15} /> Uso responsable de la información</span>
          </div>

          <div className="home-footer-column home-footer-contact">
            <h2>Estamos para orientarte</h2>
            <p><MapPin size={16} /><span>Av. Las Palmeras 450<br />Lima, Perú</span></p>
            <a href="tel:+51014829100"><Phone size={15} /><span>(01) 482-9100</span></a>
            <a href="tel:+51984215889"><Phone size={15} /><span>984-215-889</span></a>
            <a href="mailto:secretaria@colegio.edu.pe"><Mail size={15} /><span>secretaria@colegio.edu.pe</span></a>
            <span className="home-footer-hours"><Clock size={15} /> Atención: lunes a viernes, 8:00 a. m. – 4:00 p. m.</span>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>© {copyrightYear} Colegio Secundario San Juan Bautista</span>
          <button type="button" onClick={() => setTermsOpen(true)}>Términos y condiciones</button>
        </div>
      </footer>
      <SchoolModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Términos y condiciones"
        description="Uso del portal institucional y solicitudes de matrícula"
        size="large"
      >
        <div className="home-terms-content">
          <p>Al utilizar este portal, aceptas las siguientes condiciones para los servicios digitales del Colegio Secundario San Juan Bautista:</p>
          <ol>
            <li><strong>Uso del portal.</strong> El portal debe utilizarse únicamente para consultas institucionales, gestión académica y trámites de matrícula autorizados.</li>
            <li><strong>Información veraz.</strong> Quien registra una solicitud es responsable de proporcionar datos completos y correctos, y de adjuntar documentación legible y auténtica cuando corresponda.</li>
            <li><strong>Revisión de matrícula.</strong> El envío de una solicitud no confirma una vacante ni formaliza la matrícula. La solicitud queda pendiente de revisión y validación por parte de Secretaría.</li>
            <li><strong>Acceso institucional.</strong> Las credenciales de los usuarios autorizados son personales y deben mantenerse confidenciales. El usuario debe informar a la institución si sospecha que otra persona las utilizó.</li>
            <li><strong>Tratamiento de datos.</strong> Los datos enviados se utilizan para atender la solicitud y brindar los servicios escolares relacionados, con acceso limitado al personal autorizado y de acuerdo con la normativa aplicable.</li>
            <li><strong>Uso adecuado.</strong> No está permitido intentar acceder a información de terceros, alterar datos sin autorización ni interrumpir el funcionamiento del portal.</li>
          </ol>
          <p>Para consultas sobre una solicitud o el uso del portal, comunícate con Secretaría en <a href="mailto:secretaria@colegio.edu.pe">secretaria@colegio.edu.pe</a>.</p>
        </div>
      </SchoolModal>
    </div>
  );
}
