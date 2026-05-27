import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api';

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

  useEffect(() => {
    if (user?.hospital_id) {
      api.get(`/ambulances?hospital_id=${user.hospital_id}`).then(res => {
        setAmbulances(res.data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user?.hospital_id) return;
    
    socket.emit('join_room', `hospital:${user.hospital_id}`);

    socket.on('call_assigned', (data: CallAssignment) => {
      setCalls(prev => [data, ...prev]);
    });

    socket.on('location_update', (data: any) => {
      // optional: update last updated time or location if we were showing it
    });

    return () => {
      socket.off('call_assigned');
      socket.off('location_update');
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

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    en_route: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-red-100 text-red-800',
    offline: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Ambulance Fleet</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">License Plate</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">Driver</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">Last Updated</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ambulances.map(amb => (
                  <tr key={amb.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{amb.license_plate}</td>
                    <td className="py-3 px-4 text-gray-600">{amb.driver_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[amb.status]}`}>
                        {amb.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(amb.updated_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <select 
                        value={amb.status}
                        onChange={(e) => updateStatus(amb.id, e.target.value as any)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        <option value="available">Available</option>
                        <option value="en_route">En Route</option>
                        <option value="occupied">Occupied</option>
                        <option value="offline">Offline</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {ambulances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No ambulances found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Live Call Queue</h2>
          <div className="space-y-4">
            {calls.map((c, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-blue-100 bg-blue-50 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-blue-900">Call ID: {c.call.id.slice(0, 8)}...</p>
                  <p className="text-sm text-blue-700">Address: {c.call.pickup_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-900">Assigned to: {c.assignment.ambulanceId.slice(0, 8)}</p>
                  <p className="text-lg font-bold text-blue-600">ETA: {c.assignment.assignment.pickup_eta_minutes} min</p>
                </div>
              </div>
            ))}
            {calls.length === 0 && (
              <p className="text-gray-500 italic">No incoming calls in current session.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
