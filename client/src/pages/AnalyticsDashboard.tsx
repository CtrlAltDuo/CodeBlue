import React, { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../contexts/ToastContext';

interface CallVolumeData {
  date: string;
  count: string;
}

interface ResponseTimeData {
  district_lat: string;
  district_lng: string;
  total_calls: string;
  avg_response_min: string;
}

interface AmbulanceUtilData {
  id: string;
  license_plate: string;
  status: string;
  total_completed_calls: string;
  avg_en_route_min: string;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [callVolume, setCallVolume] = useState<CallVolumeData[]>([]);
  const [responseTimes, setResponseTimes] = useState<ResponseTimeData[]>([]);
  const [ambulanceUtil, setAmbulanceUtil] = useState<AmbulanceUtilData[]>([]);
  
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [volRes, timeRes, utilRes] = await Promise.all([
          api.get(`/analytics/call-volume`),
          api.get(`/analytics/response-times`),
          api.get(`/analytics/ambulance-utilization`)
        ]);
        
        setCallVolume(volRes.data);
        setResponseTimes(timeRes.data);
        setAmbulanceUtil(utilRes.data);
      } catch (err: any) {
        addToast(err.response?.data?.error || err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-900"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVolume = callVolume.find(c => c.date.startsWith(todayStr))?.count || '0';
  
  const avgResponseToday = responseTimes.length > 0 
    ? (responseTimes.reduce((acc, curr) => acc + parseFloat(curr.avg_response_min), 0) / responseTimes.length).toFixed(1)
    : 'N/A';
    
  const busiestDistrict = responseTimes.length > 0
    ? `${responseTimes[0].district_lat}, ${responseTimes[0].district_lng}`
    : 'N/A';
    
  const totalFleet = ambulanceUtil.length;
  const availableFleet = ambulanceUtil.filter(a => a.status === 'available').length;
  const fleetAvailPercent = totalFleet > 0 ? ((availableFleet / totalFleet) * 100).toFixed(1) : '0';

  const formattedResponseTimes = responseTimes.map(r => ({
    name: `${r.district_lat}, ${r.district_lng}`,
    avgResponse: parseFloat(r.avg_response_min || '0'),
    calls: parseInt(r.total_calls, 10)
  }));

  const formattedCallVolume = callVolume.map(c => ({
    date: c.date.split('T')[0].slice(5),
    calls: parseInt(c.count, 10)
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Today's Total Calls</p>
          <p className="text-3xl font-bold text-slate-800">{todayVolume}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg Response (min)</p>
          <p className="text-3xl font-bold text-slate-800">{avgResponseToday}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Busiest District</p>
          <p className="text-xl font-bold text-slate-800 truncate" title={busiestDistrict}>{busiestDistrict}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Fleet Availability</p>
          <p className="text-3xl font-bold text-slate-800">{fleetAvailPercent}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Call Volume (30 Days)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedCallVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#ef4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Avg Response Time by District (Top 10)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedResponseTimes} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" tick={{fontSize: 12}} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="avgResponse" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg Min" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Ambulance Utilization</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg En-Route (min)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ambulanceUtil.map((amb) => (
                <tr key={amb.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{amb.license_plate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      amb.status === 'available' ? 'bg-green-100 text-green-800' :
                      amb.status === 'en_route' ? 'bg-yellow-100 text-yellow-800' :
                      amb.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {amb.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{amb.total_completed_calls}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {amb.avg_en_route_min ? parseFloat(amb.avg_en_route_min).toFixed(1) : '0.0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
