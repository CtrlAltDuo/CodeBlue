import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api';
import Skeleton from '../components/Skeleton';

type Ambulance = {
  id: string;
  license_plate: string;
  driver_name?: string;
  status: 'available' | 'en_route' | 'occupied' | 'offline';
  updated_at: string;
};

type CallAssignment = {
  call: any;
  assignment: any;
};

export default function HospitalDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [calls, setCalls] = useState<CallAssignment[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [beds, setBeds] = useState(0);
  const [icus, setIcus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.hospital_id) {
      Promise.all([
        api.get(`/ambulances?hospital_id=${user.hospital_id}`),
        api.get(`/hospitals/${user.hospital_id}`)
      ]).then(([ambRes, hospRes]) => {
        setAmbulances(ambRes.data);
        setHospitalInfo(hospRes.data);
        setBeds(hospRes.data.available_beds);
        setIcus(hospRes.data.available_icus);
        setLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user?.hospital_id) return;
    
    socket.emit('join_room', `hospital:${user.hospital_id}`);

    socket.on('call_assigned', (data: CallAssignment) => {
      setCalls(prev => [data, ...prev]);
    });

    return () => {
      socket.off('call_assigned');
    };
  }, [socket, user]);

  const updateStatus = async (id: string, newStatus: Ambulance['status']) => {
    try {
      const res = await api.patch(`/ambulances/${id}/status`, { status: newStatus });
      setAmbulances(prev => prev.map(a => a.id === id ? { ...a, status: res.data.status, updated_at: res.data.updated_at } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const updateInventory = async () => {
    if (!user?.hospital_id) return;
    try {
      await api.patch(`/hospitals/${user.hospital_id}/inventory`, { available_beds: beds, available_icus: icus });
      alert('Inventory updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update inventory');
    }
  };

  const statusConfig = {
    available: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Available' },
    en_route: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'En Route' },
    occupied: { color: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Occupied' },
    offline: { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Offline' }
  };

  const activeAmbulancesCount = ambulances.filter(a => a.status === 'en_route' || a.status === 'occupied').length;
  const availableAmbulancesCount = ambulances.filter(a => a.status === 'available').length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Hospital Command Center</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium transition-colors">Real-time overview of fleet operations and incoming emergencies.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 shadow-sm text-center transition-colors">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Fleet</div>
              {loading ? <Skeleton className="w-12 h-8 mx-auto mt-1" /> : <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeAmbulancesCount}</div>}
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 shadow-sm text-center transition-colors">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Available</div>
              {loading ? <Skeleton className="w-12 h-8 mx-auto mt-1" /> : <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableAmbulancesCount}</div>}
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 shadow-sm flex items-center gap-4 transition-colors">
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avail. Beds</div>
                {loading ? <Skeleton className="w-24 h-10" /> : <input type="number" className="w-24 px-3 py-2 text-center text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors" value={beds} onChange={e => setBeds(parseInt(e.target.value) || 0)} />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avail. ICUs</div>
                {loading ? <Skeleton className="w-24 h-10" /> : <input type="number" className="w-24 px-3 py-2 text-center text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors" value={icus} onChange={e => setIcus(parseInt(e.target.value) || 0)} />}
              </div>
              <button onClick={updateInventory} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-[0.98]">Save</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ambulance Fleet Data Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors">
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Fleet Status
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Driver</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Sync</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-4 px-6"><Skeleton className="w-24 h-5 mb-2" /><Skeleton className="w-16 h-3" /></td>
                          <td className="py-4 px-6"><Skeleton className="w-32 h-5" /></td>
                          <td className="py-4 px-6"><Skeleton className="w-20 h-6" /></td>
                          <td className="py-4 px-6"><Skeleton className="w-16 h-5" /></td>
                          <td className="py-4 px-6"><Skeleton className="w-24 h-8 ml-auto" /></td>
                        </tr>
                      ))
                    ) : ambulances.map(amb => (
                      <tr key={amb.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{amb.license_plate}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID: {amb.id.slice(0,8)}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                          {amb.driver_name || <span className="text-slate-300 dark:text-slate-600 italic">Unassigned</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig[amb.status].color}`}>
                            {statusConfig[amb.status].label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(amb.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <select 
                            value={amb.status}
                            onChange={(e) => updateStatus(amb.id, e.target.value as any)}
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <option value="available">Set Available</option>
                            <option value="en_route">Set En Route</option>
                            <option value="occupied">Set Occupied</option>
                            <option value="offline">Set Offline</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {!loading && ambulances.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">No ambulances registered to this hospital.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Incoming Emergency Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors">
              <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Live Dispatch Feed
            </h2>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-800/50 p-5 min-h-[400px] flex flex-col transition-colors">
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {calls.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-700 bg-slate-800 animate-fade-in hover:border-blue-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                        DISPATCHED
                      </span>
                      <span className="text-xs font-mono text-slate-500">#{c.call.id.slice(0, 6)}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-300 mb-3 leading-relaxed">
                      {c.call.pickup_address}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                        Amb. {c.assignment.ambulanceId.slice(0, 6)}
                      </div>
                      <div className="text-sm font-bold text-blue-400">
                        ETA: {c.assignment.assignment.pickup_eta_minutes}m
                      </div>
                    </div>
                  </div>
                ))}
                {calls.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm font-medium">Waiting for emergency dispatches...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
