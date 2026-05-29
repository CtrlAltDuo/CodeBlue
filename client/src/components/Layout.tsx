import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { io } from 'socket.io-client';

export default function Layout() {
  const { user, logout } = useAuth();
  const { toasts, removeToast } = useToast();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(true);

  // We want to hide the navbar completely on login/register/citizen, 
  // or show a very minimal one. For now, if not logged in, we only show
  // the layout content and rely on the pages themselves to have headers 
  // (like CitizenApp already does). Or we can show a top bar for staff.
  const isPublicRoute = !user;

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl, { reconnectionAttempts: Infinity });
    
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {!isPublicRoute && (
        <nav className="bg-slate-900 border-b border-slate-800 text-slate-300 shadow-xl z-50 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  CodeBlue
                </Link>
                
                <div className="hidden md:flex items-center space-x-1">
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin-map" className="hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all">Dispatch Hub</Link>
                      <Link to="/analytics" className="hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all">Analytics</Link>
                    </>
                  )}
                  {user?.role === 'hospital_staff' && (
                    <Link to="/hospital" className="hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all">Hospital Dashboard</Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link to="/driver" className="hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all">Driver Terminal</Link>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-sm font-bold text-white">{user?.name}</span>
                  <span className="text-xs text-slate-400 capitalize">{user?.role.replace('_', ' ')}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="bg-slate-800 hover:bg-red-600 hover:text-white border border-slate-700 hover:border-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {isPublicRoute && (
        <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
          <Link to="/" className="font-extrabold text-2xl tracking-tight text-slate-900 pointer-events-auto flex items-center gap-2 drop-shadow-sm">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            CodeBlue
          </Link>
          <Link to="/login" className="pointer-events-auto bg-white/50 backdrop-blur-md hover:bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 transition-all shadow-sm">
            Staff Login
          </Link>
        </div>
      )}

      {!connected && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-bold z-40 relative shadow-md animate-pulse">
          Connection lost. Reconnecting to CodeBlue servers...
        </div>
      )}

      <main className="flex-1 relative flex flex-col">
        <Outlet />
      </main>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl text-white min-w-[320px] transform transition-all animate-fade-in ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <span className="font-semibold text-sm">{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-4 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
