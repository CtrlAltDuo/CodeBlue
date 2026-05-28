import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { mappls, mappls_plugin } from 'mappls-web-maps';
import { Ambulance, IncidentCall } from '../../../shared/types';

const getAmbulanceSvg = (status: string) => {
  let color = 'gray';
  if (status === 'AVAILABLE') color = '#22c55e';
  if (status === 'EN_ROUTE') color = '#eab308';
  if (status === 'OCCUPIED') color = '#ef4444';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getCallSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="8" fill="#ef4444">
      <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="16" cy="16" r="6" fill="#b91c1c" />
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function AdminMap() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [calls, setCalls] = useState<IncidentCall[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const mapplsClassRef = useRef<any>(null);
  
  const ambulanceMarkersRef = useRef<Record<string, any>>({});
  const callMarkersRef = useRef<Record<string, any>>({});
  const heatmapLayerRef = useRef<any>(null);

  useEffect(() => {
    fetchInitialData();
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
      initMap(ambRes.data, callRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const initMap = (initialAmbulances: Ambulance[], initialCalls: IncidentCall[]) => {
    const mapplsClassObject = new mappls();
    mapplsClassRef.current = mapplsClassObject;

    mapplsClassObject.initialize(import.meta.env.VITE_MAPPLS_API_KEY, { map: true }, () => {
      if (!mapRef.current) return;

      const map = mapplsClassObject.Map({
        id: mapRef.current.id,
        properties: {
          center: [20.5937, 78.9629],
          zoom: 5
        }
      });
      mapInstanceRef.current = map;

      initialAmbulances.forEach(amb => createAmbulanceMarker(amb));
      initialCalls.forEach(call => createCallMarker(call));

      if (initialCalls.length > 0) {
        const bounds = initialCalls.map(c => [c.pickup_lat, c.pickup_lng]);
        // Simple fit bounds logic or just set center to first call
        if (bounds.length > 0) {
           map.setCenter({ lat: bounds[0][0], lng: bounds[0][1] });
           map.setZoom(10);
        }
      }

      initSocket();
    });
  };

  const createAmbulanceMarker = (amb: Ambulance) => {
    if (!mapInstanceRef.current || !mapplsClassRef.current) return;
    
    if (ambulanceMarkersRef.current[amb.id]) {
      ambulanceMarkersRef.current[amb.id].remove();
    }

    const marker = mapplsClassRef.current.Marker({
      map: mapInstanceRef.current,
      position: { lat: amb.current_lat, lng: amb.current_lng },
      icon_url: getAmbulanceSvg(amb.status)
    });

    const info = `<div>
      <h3 style="font-weight:bold">${amb.license_plate}</h3>
      <p>Status: ${amb.status}</p>
      <p>Driver ID: ${amb.driver_id}</p>
    </div>`;

    const infoWindow = mapplsClassRef.current.InfoWindow({
      map: mapInstanceRef.current,
      content: info,
      position: { lat: amb.current_lat, lng: amb.current_lng }
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    ambulanceMarkersRef.current[amb.id] = marker;
  };

  const createCallMarker = (call: IncidentCall) => {
    if (!mapInstanceRef.current || !mapplsClassRef.current) return;

    if (callMarkersRef.current[call.id]) {
      callMarkersRef.current[call.id].remove();
    }

    const marker = mapplsClassRef.current.Marker({
      map: mapInstanceRef.current,
      position: { lat: call.pickup_lat, lng: call.pickup_lng },
      icon_url: getCallSvg()
    });

    const info = `<div>
      <h3 style="font-weight:bold">Emergency</h3>
      <p>${call.pickup_address}</p>
      <p>Phone: ${call.caller_phone}</p>
      <p>Status: ${call.status}</p>
    </div>`;

    const infoWindow = mapplsClassRef.current.InfoWindow({
      map: mapInstanceRef.current,
      content: info,
      position: { lat: call.pickup_lat, lng: call.pickup_lng }
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker);
    });

    callMarkersRef.current[call.id] = marker;
  };

  const initSocket = () => {
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
          createAmbulanceMarker(updated[idx]);
        }
        return updated;
      });
    });

    socket.on('call_assigned', (data: any) => {
      setCalls(prev => {
        if (!prev.find(c => c.id === data.call.id)) {
           const updated = [data.call, ...prev];
           createCallMarker(data.call);
           return updated;
        }
        return prev;
      });
    });
    
    socket.on('call_completed', (data: any) => {
      setCalls(prev => {
         const updated = prev.filter(c => c.id !== data.id);
         if (callMarkersRef.current[data.id]) {
           callMarkersRef.current[data.id].remove();
           delete callMarkersRef.current[data.id];
         }
         return updated;
      });
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const toggleHeatmap = async () => {
    const newVal = !heatmapMode;
    setHeatmapMode(newVal);

    if (newVal) {
      Object.values(ambulanceMarkersRef.current).forEach(m => m.remove());
      Object.values(callMarkersRef.current).forEach(m => m.remove());

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/calls?status=COMPLETED`);
        const heatData = res.data.map((c: IncidentCall) => ({
          lat: c.pickup_lat,
          lng: c.pickup_lng,
          weight: 1
        }));

        const pluginObject = new mappls_plugin();
        heatmapLayerRef.current = pluginObject.HeatmapLayer({
          map: mapInstanceRef.current,
          data: heatData,
          radius: 20
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      if (heatmapLayerRef.current) {
        // Mappls heatmaps don't always have a clear remove/hide method documented, so we re-render or attempt to clear.
        try {
          heatmapLayerRef.current.clear();
        } catch(e) {}
        heatmapLayerRef.current = null;
      }
      ambulances.forEach(createAmbulanceMarker);
      calls.forEach(createCallMarker);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div id="admin-map" ref={mapRef} className="absolute inset-0 z-0"></div>

      <div className={`absolute top-4 left-4 z-10 bg-white rounded-xl shadow-xl transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'} overflow-hidden`}>
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <h2 className={`font-bold whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Dispatch Center</h2>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </div>
        
        {sidebarOpen && (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{calls.length}</div>
                  <div className="text-xs text-blue-800">Active Calls</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ambulances.filter(a => a.status === 'AVAILABLE').length}
                  </div>
                  <div className="text-xs text-green-800">Available</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {ambulances.filter(a => a.status === 'EN_ROUTE').length}
                  </div>
                  <div className="text-xs text-yellow-800">En Route</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {ambulances.filter(a => a.status === 'OCCUPIED').length}
                  </div>
                  <div className="text-xs text-red-800">Occupied</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={toggleHeatmap}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                heatmapMode ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {heatmapMode ? 'Exit Heatmap Mode' : 'Show Incident Heatmap'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
