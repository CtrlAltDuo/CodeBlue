import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Ambulance, IncidentCall } from '../../../shared/types';

// Map Icons
const getAmbulanceIcon = (status: string) => {
  let color = 'gray';
  if (status === 'AVAILABLE') color = '#22c55e';
  if (status === 'EN_ROUTE') color = '#eab308';
  if (status === 'OCCUPIED') color = '#ef4444';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: svg,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const callIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="8" fill="#ef4444">
      <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="16" cy="16" r="6" fill="#b91c1c" />
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function AdminMap() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [calls, setCalls] = useState<IncidentCall[]>([]);
  const [completedCalls, setCompletedCalls] = useState<IncidentCall[]>([]);
  const [prepositionZones, setPrepositionZones] = useState<any[]>([]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [prepositionMode, setPrepositionMode] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchInitialData();
    initSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const [ambRes, callRes] = await Promise.all([
        axios.get(`${apiUrl}/api/ambulances`),
        axios.get(`${apiUrl}/api/calls?status=PENDING`)
      ]);
      setAmbulances(ambRes.data);
      setCalls(callRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const initSocket = () => {
    if (socketRef.current) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl);
    socketRef.current = socket;

    socket.emit('subscribe', 'admin');

    socket.on('location_update', (data: any) => {
      setAmbulances(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(a => a.id === data.ambulanceId);
        if (idx !== -1) {
          updated[idx].current_lat = data.lat;
          updated[idx].current_lng = data.lng;
        }
        return updated;
      });
    });

    socket.on('call_assigned', (data: any) => {
      setCalls(prev => {
        if (!prev.find(c => c.id === data.call.id)) {
           return [data.call, ...prev];
        }
        return prev;
      });
    });
    
    socket.on('call_completed', (data: any) => {
      setCalls(prev => prev.filter(c => c.id !== data.id));
    });
  };

  const toggleHeatmap = async () => {
    const newVal = !heatmapMode;
    setHeatmapMode(newVal);

    if (newVal && completedCalls.length === 0) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/calls?status=COMPLETED`);
        setCompletedCalls(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const togglePreposition = async () => {
    const newVal = !prepositionMode;
    setPrepositionMode(newVal);

    if (newVal && prepositionZones.length === 0) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/analytics/preposition-zones`);
        setPrepositionZones(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Center of India roughly
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Heatmap/Historical Incident Clusters overlay */}
        {heatmapMode && completedCalls.map(c => (
          <Circle 
            key={c.id}
            center={[c.pickup_lat, c.pickup_lng]} 
            pathOptions={{ fillColor: '#ef4444', color: 'transparent', fillOpacity: 0.3 }} 
            radius={2000} 
          />
        ))}

        {/* Preposition Zones overlay */}
        {prepositionMode && prepositionZones.map((zone, i) => (
          <Circle 
            key={i}
            center={[zone.lat, zone.lng]} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }} 
            radius={5000} 
          >
            <Popup>AI Pre-positioning Hotspot</Popup>
          </Circle>
        ))}

        {/* Live Active Data Layers */}
        {!heatmapMode && (
          <>
            {ambulances.map(amb => (
              <Marker 
                key={amb.id} 
                position={[amb.current_lat, amb.current_lng]} 
                icon={getAmbulanceIcon(amb.status)}
              >
                <Popup className="rounded-xl overflow-hidden shadow-lg border-0">
                  <div className="p-1">
                    <h3 className="font-bold text-gray-900 text-lg border-b pb-2 mb-2">{amb.license_plate}</h3>
                    <p className="text-gray-600 text-sm mb-1"><span className="font-semibold">Status:</span> {amb.status}</p>
                    <p className="text-gray-600 text-sm"><span className="font-semibold">Driver ID:</span> {amb.driver_id}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {calls.map(call => (
              <Marker 
                key={call.id} 
                position={[call.pickup_lat, call.pickup_lng]} 
                icon={callIcon}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-red-600 text-lg border-b pb-2 mb-2">Emergency</h3>
                    <p className="text-gray-700 text-sm mb-1 font-medium">{call.pickup_address}</p>
                    <p className="text-gray-600 text-sm mb-1"><span className="font-semibold">Phone:</span> {call.caller_phone}</p>
                    <p className="text-gray-600 text-sm"><span className="font-semibold">Status:</span> {call.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>

      <div className={`absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'} overflow-hidden`}>
        <div className="p-5 text-white flex justify-between items-center cursor-pointer border-b border-gray-800" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <h2 className={`font-bold tracking-wide text-lg ${!sidebarOpen && 'hidden'}`}>Dispatch Center</h2>
          <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </div>
        
        {sidebarOpen && (
          <div className="p-5">
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Fleet Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl text-center">
                  <div className="text-3xl font-black text-blue-500 mb-1">{calls.length}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Calls</div>
                </div>
                <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl text-center">
                  <div className="text-3xl font-black text-green-500 mb-1">
                    {ambulances.filter(a => a.status === 'AVAILABLE').length}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Available</div>
                </div>
                <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl text-center">
                  <div className="text-3xl font-black text-yellow-500 mb-1">
                    {ambulances.filter(a => a.status === 'EN_ROUTE').length}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">En Route</div>
                </div>
                <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl text-center">
                  <div className="text-3xl font-black text-red-500 mb-1">
                    {ambulances.filter(a => a.status === 'OCCUPIED').length}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Occupied</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Analytics Overlay</h3>
              <button
                onClick={toggleHeatmap}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  heatmapMode ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${heatmapMode ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {heatmapMode ? 'Exit Heatmap Mode' : 'Show Incident Clusters'}
              </button>
              
              <button
                onClick={togglePreposition}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  prepositionMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${prepositionMode ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {prepositionMode ? 'Hide Predictive Zones' : 'Show Predictive Zones'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
