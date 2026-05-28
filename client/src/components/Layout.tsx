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
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-slate-900 text-white shadow-lg z-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to={user?.role === 'admin' ? '/admin-map' : '/'} className="font-bold text-xl text-red-500">
                CodeBlue
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin-map" className="hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium">Dispatch Map</Link>
                  <Link to="/analytics" className="hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium">Analytics</Link>
                </>
              )}
              {user?.role === 'hospital_staff' && (
                <Link to="/hospital" className="hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
              )}
              {user?.role === 'driver' && (
                <Link to="/driver" className="hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium">Driver App</Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/citizen" className="text-gray-300 hover:text-white px-3 py-2 text-sm">Emergency Request (Citizen)</Link>
              {user ? (
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition">
                  Logout
                </button>
              ) : (
                <Link to="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {!connected && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-bold z-40 relative shadow-md">
          Disconnected from server. Reconnecting...
        </div>
      )}

      <main className="flex-1 relative">
        <Outlet />
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-xl text-white min-w-[300px] transform transition-all ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
            }`}
          >
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-4 text-white hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
