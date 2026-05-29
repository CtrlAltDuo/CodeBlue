import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
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
  const [ambulancePlate, setAmbulancePlate] = useState('');
  const [ambulanceLoc, setAmbulanceLoc] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [status, setStatus] = useState<'Ambulance assigned' | 'Driver en route' | 'Arrived'>('Ambulance assigned');
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (location && !callId) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      axios.get(`${apiUrl}/api/hospitals/nearby?lat=${location.lat}&lng=${location.lng}`)
        .then(res => setNearbyHospitals(res.data))
        .catch(err => console.error(err));
    }
  }, [location, callId]);

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
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/calls`, {
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
          setEta(assignment.pickup_eta_minutes);
          setAmbulancePlate(`Assigned ID: ${assignment.ambulanceId}`);
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

  const initTracking = (activeCallId: string, lat: number, lng: number) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl);
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT PANEL - Form & Status */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 bg-white shadow-2xl z-10 flex flex-col h-screen overflow-y-auto">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50/80 backdrop-blur-md border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm shadow-sm animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all duration-200"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Pickup Location</label>
                <p className="text-xs text-gray-500 mb-2">Drag the marker on the map to pin your exact location, or use GPS.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all duration-200"
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
          ) : (
            <div className="space-y-6 animate-fade-in flex flex-col h-full justify-center">
              <div className="bg-white border border-green-200 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500 animate-pulse"></div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-gray-900 text-3xl mb-2">{status}</h3>
                <p className="text-gray-500 font-medium mb-6 text-lg tracking-wide">{ambulancePlate}</p>
                {eta !== null && (
                  <div className="inline-block bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl font-bold text-2xl shadow-sm">
                    ETA: {eta} minutes
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Instructions</h4>
                <ul className="text-slate-600 text-sm space-y-2 list-disc list-inside">
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
              {nearbyHospitals.map(h => (
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
          <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-200 pointer-events-none">
            <span className="font-medium text-gray-700">📍 Click anywhere on the map to drop a pin</span>
          </div>
        )}
      </div>

    </div>
  );
}
