import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import api from '../api';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Map icons
const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M19 8h-2V6c0-1.1-.9-2-2-2H9C7.9 4 7 4.9 7 6v2H5c-1.1 0-2 .9-2 2v8h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7 6h10v5H7V6z"/></svg></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Component to handle clicks on the map to set pickup location
function LocationSelector({ location, setLocation, setAddress }: any) {
  const map = useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      // Reverse geocode simple fallback
      setAddress(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
    },
  });

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);

  return location === null ? null : (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={userIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setLocation({ lat: position.lat, lng: position.lng });
          setAddress(`Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`);
        },
      }}
    />
  );
}

// Component to recenter tracking map dynamically
function TrackingBounds({ userLoc, ambLoc }: any) {
  const map = useMap();
  useEffect(() => {
    if (userLoc && ambLoc) {
      const bounds = L.latLngBounds([userLoc, ambLoc]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [userLoc, ambLoc, map]);
  return null;
}

export default function CitizenApp() {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // Default to Delhi center roughly
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>({ lat: 28.6139, lng: 77.2090 });
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [callId, setCallId] = useState<string | null>(null);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [ambulancePlate, setAmbulancePlate] = useState('');
  const [ambulanceLoc, setAmbulanceLoc] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [status, setStatus] = useState<'Ambulance assigned' | 'Driver en route' | 'Arrived'>('Ambulance assigned');
  const [assignedAt, setAssignedAt] = useState<number | null>(null);
  const [reassignTimeLeft, setReassignTimeLeft] = useState<number>(120);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (location && !callId) {
      api.get(`/hospitals/nearby?lat=${location.lat}&lng=${location.lng}`)
        .then(res => setNearbyHospitals(res.data))
        .catch(err => console.error(err));
    }
  }, [location, callId]);

  useEffect(() => {
    if (assignedAt && reassignTimeLeft > 0) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - assignedAt) / 1000);
        const left = Math.max(0, 120 - elapsed);
        setReassignTimeLeft(left);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [assignedAt, reassignTimeLeft]);

  const handleUseCurrentLocation = () => {
    setLocationLoading(true);
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(newLoc);
          
          try {
            // Optional: simple reverse geocode using Nominatim open API (no key required)
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLoc.lat}&lon=${newLoc.lng}`);
            if (res.data && res.data.display_name) {
              setAddress(res.data.display_name);
            } else {
              setAddress('Current GPS Location');
            }
          } catch (e) {
            setAddress('Current GPS Location');
          }
          setLocationLoading(false);
        },
        (err) => {
          setError('Failed to get location. Please allow location access.');
          setLocationLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address || !location) {
      setError('Please provide phone and select a location on the map');
      return;
    }
    
    // Validate phone number is exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/calls`, {
        caller_phone: phone,
        pickup_address: address,
        pickup_lat: location.lat,
        pickup_lng: location.lng
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        const { call, assignment } = res.data;
        if (assignment && assignment.ambulanceId) {
          setCallId(call.id);
          setEta(assignment.assignment?.pickup_eta_minutes);
          setAmbulancePlate(assignment.assignment?.license_plate || `Assigned ID: ${assignment.ambulanceId}`);
          setAssignmentData(assignment.assignment);
          setAssignedAt(Date.now());
          setReassignTimeLeft(120);
          initTracking(call.id, location.lat, location.lng);
        } else {
          setError('No ambulance available currently. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!callId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/calls/${callId}/reassign`);
      const { assignment } = res.data;
      if (assignment && assignment.ambulanceId) {
        setEta(assignment.assignment?.pickup_eta_minutes);
        setAmbulancePlate(assignment.assignment?.license_plate || `Assigned ID: ${assignment.ambulanceId}`);
        setAssignmentData(assignment.assignment);
        setStatus('Ambulance assigned');
        setAmbulanceLoc(null);
        setAssignedAt(Date.now());
        setReassignTimeLeft(120);
      }
    } catch (err: any) {
      if (err.response?.data?.assignment) {
         // Keep current
         const { assignment } = err.response.data;
         setEta(assignment.assignment?.pickup_eta_minutes);
         setAmbulancePlate(assignment.assignment?.license_plate || `Assigned ID: ${assignment.ambulanceId}`);
         setAssignmentData(assignment.assignment);
      }
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const initTracking = (activeCallId: string, lat: number, lng: number) => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = rawApiUrl.replace(/\/api\/?$/, '');
    const socket = io(socketUrl);
    socketRef.current = socket;
    
    socket.emit('subscribe', `call:${activeCallId}`);
    
    socket.on('location_update', (data: { lat: number, lng: number }) => {
      setAmbulanceLoc({ lat: data.lat, lng: data.lng });

      const distKm = getDistanceFromLatLonInKm(lat, lng, data.lat, data.lng);
      const newEtaMinutes = Math.round(distKm * 1.5);
      setEta(Math.max(1, newEtaMinutes));
      
      if (distKm < 0.1) {
        setStatus('Arrived');
      } else {
        setStatus('Driver en route');
      }
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      
      {/* LEFT PANEL - Form & Status */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col h-screen overflow-y-auto transition-colors border-r border-transparent dark:border-slate-800">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white shadow-inner flex flex-col justify-center items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">CodeBlue</h1>
          <p className="text-red-100 mt-2 font-medium text-lg">Emergency Dispatch System</p>
        </div>
        
        <div className="p-8 flex-grow">
          {!callId ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50/80 backdrop-blur-md border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm shadow-sm animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all duration-200"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Pickup Location</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 transition-colors">Drag the marker on the map to pin your exact location, or use GPS.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all duration-200"
                    placeholder="Enter pickup address"
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="shrink-0 flex items-center justify-center px-5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-wait shadow-sm"
                    title="Use Current Location"
                  >
                    {locationLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 pulse-glow w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg py-5 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform active:scale-95 disabled:opacity-70 disabled:transform-none shadow-xl"
              >
                {loading ? 'Requesting Ambulance...' : 'GET HELP NOW'}
              </button>
            </form>
            
            {nearbyHospitals.length > 0 && phone.replace(/\D/g, '').length === 10 && address && location && (
              <div className="mt-8 space-y-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-sm transition-colors">Nearby Emergency Centers</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {nearbyHospitals.map(h => (
                    <div key={h.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white transition-colors">{h.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">{h.address}</p>
                        </div>
                        {h.eta ? (
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors">
                            ETA: {h.eta} min
                          </div>
                        ) : (
                          <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors">
                            Unavailable
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 transition-colors">
                        <div className="text-center flex-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 transition-colors">Available Beds</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 transition-colors">{h.available_beds}</div>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 transition-colors">Available ICUs</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 transition-colors">{h.available_icus}</div>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 transition-colors">Ambulances</div>
                          <div className="font-bold text-blue-600 dark:text-blue-400 transition-colors">{h.available_ambulances || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="space-y-6 animate-fade-in flex flex-col h-full justify-center">
              <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900/50 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden transition-colors">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 shadow-inner transition-colors">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-3xl mb-2 transition-colors">{status}</h3>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 text-left border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ambulance Details</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{ambulancePlate}</p>
                    {assignmentData?.driver_name && <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Driver: {assignmentData.driver_name}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Dispatching From</p>
                    <p className="font-bold text-slate-900 dark:text-white transition-colors">{assignmentData?.hospital_name || 'Nearby Hospital'}</p>
                    {assignmentData?.hospital_address && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{assignmentData.hospital_address}</p>}
                  </div>
                </div>

                {eta !== null && (
                  <div className="inline-block bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 px-6 py-4 rounded-xl font-bold text-2xl shadow-sm transition-colors w-full mb-4">
                    ETA: {eta} minutes
                  </div>
                )}
                
                <button 
                  onClick={handleReassign}
                  disabled={loading || reassignTimeLeft === 0}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  {loading ? 'Reassigning...' : reassignTimeLeft > 0 ? `Reassign Ambulance (${reassignTimeLeft}s)` : 'Reassign Unavailable'}
                </button>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 transition-colors">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 transition-colors">Instructions</h4>
                <ul className="text-slate-600 dark:text-slate-400 text-sm space-y-2 list-disc list-inside transition-colors">
                  <li>Stay calm and keep your phone line open.</li>
                  <li>Gather any relevant medical history or medications.</li>
                  <li>Unlock doors and ensure a clear pathway for paramedics.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Leaflet Map */}
      <div className="flex-1 relative h-[50vh] md:h-screen z-0 bg-slate-200">
        <MapContainer 
          center={[location?.lat || 28.6139, location?.lng || 77.2090]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {!callId ? (
            <>
              <LocationSelector location={location} setLocation={setLocation} setAddress={setAddress} />
              {phone.replace(/\D/g, '').length === 10 && address && location && nearbyHospitals.map(h => (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <h3 className="font-bold text-lg mb-1 text-slate-800">{h.name}</h3>
                      <p className="text-slate-600 mb-1 text-xs">{h.address}</p>
                      <p className="font-medium text-blue-600 mb-2 text-xs">📞 {h.contact_phone}</p>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-center">
                        <div className="bg-slate-100 p-1.5 rounded">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Beds</div>
                          <div className="font-bold text-slate-800">{h.available_beds}</div>
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded">
                          <div className="text-[10px] uppercase font-bold text-slate-500">ICUs</div>
                          <div className="font-bold text-slate-800">{h.available_icus}</div>
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded col-span-2">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Available Ambulances</div>
                          <div className="font-bold text-blue-600">{h.available_ambulances || 0}</div>
                        </div>
                      </div>
                      {h.eta ? (
                        <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-2 rounded text-center font-bold text-sm">
                          🚑 Nearest Amb ETA: {h.eta} min
                        </div>
                      ) : (
                        <div className="bg-rose-100 border border-rose-200 text-rose-800 p-2 rounded text-center font-bold text-xs">
                          No ambulances available
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          ) : (
            <>
              {location && <Marker position={[location.lat, location.lng]} icon={userIcon} />}
              {ambulanceLoc && <Marker position={[ambulanceLoc.lat, ambulanceLoc.lng]} icon={ambulanceIcon} />}
              {location && ambulanceLoc && <TrackingBounds userLoc={location} ambLoc={ambulanceLoc} />}
            </>
          )}
        </MapContainer>

        {/* Floating map hint */}
        {!callId && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-200 dark:border-slate-800 pointer-events-none transition-colors whitespace-nowrap">
            <span className="font-medium text-gray-700 dark:text-gray-300">📍 Click anywhere on the map to drop a pin</span>
          </div>
        )}
      </div>

    </div>
  );
}
