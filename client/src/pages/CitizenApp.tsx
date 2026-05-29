import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useMapmyIndia } from '../hooks/useMapmyIndia';

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

export default function CitizenApp() {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [callId, setCallId] = useState<string | null>(null);
  const [ambulancePlate, setAmbulancePlate] = useState('');
  const [eta, setEta] = useState<number | null>(null);
  const [status, setStatus] = useState<'Ambulance assigned' | 'Driver en route' | 'Arrived'>('Ambulance assigned');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const ambulanceMarkerRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const mapLoaded = useMapmyIndia();

  useEffect(() => {
    if (!mapLoaded) return;
    
    // MapmyIndia place plugin handles autosuggest
    try {
      new (window as any).MapmyIndia.place({
        id: "address-input",
        callback: (data: any) => {
          if (data && data.length > 0) {
            setAddress(data[0].placeAddress);
            if (data[0].latitude && data[0].longitude) {
              setLocation({ lat: Number(data[0].latitude), lng: Number(data[0].longitude) });
            }
          }
        }
      });
    } catch (e) {
      console.error("AutoSuggest error:", e);
    }
  }, [mapLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address || !location) {
      setError('Please provide phone and a valid address from suggestions');
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
    if (!mapLoaded || !mapRef.current) return;
    
    const MapmyIndia = (window as any).MapmyIndia;
    const map = new MapmyIndia.Map(mapRef.current, {
      center: [lat, lng],
      zoom: 14
    });
    mapInstanceRef.current = map;

    new MapmyIndia.Marker({
      map: map,
      position: [lat, lng],
      icon: 'https://apis.mapmyindia.com/map_v3/1.png'
    });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl);
    socketRef.current = socket;
    
    socket.emit('subscribe', `call:${activeCallId}`);
    
    socket.on('location_update', (data: { lat: number, lng: number }) => {
      if (!ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current = new MapmyIndia.Marker({
          map: map,
          position: [data.lat, data.lng],
          icon: 'https://apis.mapmyindia.com/map_v3/2.png'
        });
      } else {
        ambulanceMarkerRef.current.setPosition([data.lat, data.lng]);
      }

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-600 p-6 text-white">
          <h1 className="text-2xl font-bold">CodeBlue Emergency</h1>
          <p className="text-red-100 mt-1">Get an ambulance immediately</p>
        </div>
        
        <div className="p-6">
          {!callId ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                <input
                  id="address-input"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Search location..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {loading ? 'Requesting...' : 'Get Help Now'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-green-800 text-lg mb-1">{status}</h3>
                <p className="text-green-700">{ambulancePlate}</p>
                {eta !== null && <p className="text-green-700 font-medium">ETA: {eta} mins</p>}
              </div>
              
              <div 
                id="tracking-map" 
                ref={mapRef} 
                className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border"
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
