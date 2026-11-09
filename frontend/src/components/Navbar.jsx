import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { School, Home, UserCheck, LogIn } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isHome = location.pathname === '/';

  return (
    <header className={`public-navbar sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs${isHome ? ' public-navbar--home' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <School className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              Colegio Secundario San Juan
            </span>
            <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sistema de Gestión Escolar
            </span>
          </div>
        </Link>

        {/* Exact 3 Navigation Buttons as requested */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {/* 1. Inicio */}
          <Link
            to="/"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive('/')
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </Link>

          {/* 2. Matrícula */}
          <Link
            to="/matricula"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive('/matricula')
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Matrícula</span>
          </Link>

          {/* 3. Iniciar Sesión */}
          <Link
            to="/login"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-all ${
              isActive('/login')
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
