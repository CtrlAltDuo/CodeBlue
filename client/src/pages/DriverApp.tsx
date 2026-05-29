import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api';

export default function DriverApp() {
  const { user } = useAuth();
  const socket = useSocket();
  const [status, setStatus] = useState<'offline' | 'available' | 'en_route' | 'occupied'>('offline');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [pendingCall, setPendingCall] = useState<any>(null);
  const [timeoutSecs, setTimeoutSecs] = useState(10);
  const timerRef = useRef<any>(null);
  const [ambulanceId, setAmbulanceId] = useState<string | null>(user?.ambulance_id || null);

  useEffect(() => {
    if (!user) return;
    
    api.get(`/ambulances`).then(res => {
      const myAmb = res.data.find((a: any) => a.driver_id === user.id);
      if (myAmb) {
        setAmbulanceId(myAmb.id);
        setStatus(myAmb.status);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!ambulanceId) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        api.patch(`/ambulances/${ambulanceId}/location`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          callId: currentCall?.call?.id
        }).catch(console.error);
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [ambulanceId, currentCall]);

  useEffect(() => {
    if (!socket || !ambulanceId) return;
    
    socket.emit('join_room', `driver:${ambulanceId}`);

    socket.on('call_assigned', (data: any) => {
      setPendingCall(data);
      setTimeoutSecs(10);
    });

    return () => {
      socket.off('call_assigned');
    };
  }, [socket, ambulanceId]);

  const updateStatus = async (newStatus: any) => {
    if (!ambulanceId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await api.patch(`${apiUrl}/api/ambulances/${ambulanceId}/status`, { status: newStatus });
      setStatus(newStatus);
      if (newStatus === 'available') {
        setCurrentCall(null);
      }
      socket?.emit('status_change', { ambulanceId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleAccept = (callData: any) => {
    clearInterval(timerRef.current);
    setCurrentCall(callData);
    setPendingCall(null);
    updateStatus('en_route');
    socket?.emit('call_accepted', { callId: callData.call.id, driverId: user?.id });
  };

  const handleReject = () => {
    clearInterval(timerRef.current);
    socket?.emit('call_rejected', { callId: pendingCall.call.id, driverId: user?.id });
    setPendingCall(null);
  };

  useEffect(() => {
    if (pendingCall) {
      timerRef.current = setInterval(() => {
        setTimeoutSecs((prev) => {
          if (prev <= 1) {
            handleAccept(pendingCall);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [pendingCall]);


  if (!ambulanceId) {
    return <div className="p-8 text-center text-xl">Loading Ambulance Data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Driver App</h1>
        <span className="px-4 py-2 rounded-full font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm transition-colors">
          {status.replace('_', ' ')}
        </span>
      </div>

      {pendingCall && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in transition-colors">
          <h2 className="text-4xl font-bold text-red-600 dark:text-red-500 animate-pulse mb-4">NEW DISPATCH</h2>
          <p className="text-2xl mb-2 text-slate-900 dark:text-white">{pendingCall.call.pickup_address}</p>
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-12">Distance: ETA {pendingCall.assignment.assignment.pickup_eta_minutes} mins</p>
          
          <div className="text-6xl font-black text-slate-900 dark:text-white mb-12">{timeoutSecs}s</div>
          
          <div className="w-full flex gap-4">
            <button 
              onClick={() => handleReject()}
              className="flex-1 py-6 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-bold active:bg-slate-300 dark:active:bg-slate-700 transition-colors"
            >
              REJECT
            </button>
            <button 
              onClick={() => handleAccept(pendingCall)}
              className="flex-1 py-6 rounded-2xl bg-emerald-500 text-white text-2xl font-bold active:bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-colors"
            >
              ACCEPT
            </button>
          </div>
        </div>
      )}

      {currentCall && status === 'en_route' ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-6 shadow-sm transition-colors">
          <div className="uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold mb-2 text-sm transition-colors">Current Dispatch</div>
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white transition-colors">{currentCall.call.pickup_address}</h2>
          
          <div className="flex-1 flex flex-col items-center justify-center mb-8">
            <div className="text-8xl font-black text-amber-500 drop-shadow-lg mb-4 transition-colors">
              {currentCall.assignment.assignment.pickup_eta_minutes}
            </div>
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Minutes ETA</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 transition-colors">
          <div className="text-slate-400 dark:text-slate-500 text-xl mb-4 transition-colors">No active dispatch</div>
          <p className="text-slate-500 dark:text-slate-600 transition-colors">Ensure status is AVAILABLE to receive calls.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-auto">
        <button 
          onClick={() => updateStatus('available')}
          className={`py-8 rounded-2xl text-xl font-bold transition-all ${
            status === 'available' 
            ? 'bg-emerald-600 text-white border-4 border-emerald-400 dark:border-emerald-500 scale-105 shadow-xl' 
            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-700'
          }`}
        >
          AVAILABLE
        </button>
        <button 
          onClick={() => updateStatus('occupied')}
          className={`py-8 rounded-2xl text-xl font-bold transition-all ${
            status === 'occupied' 
            ? 'bg-rose-600 text-white border-4 border-rose-400 dark:border-rose-500 scale-105 shadow-xl' 
            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-700'
          }`}
        >
          OCCUPIED
        </button>
      </div>
    </div>
  );
}
