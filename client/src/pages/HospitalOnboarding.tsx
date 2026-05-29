import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationPicker({ location, setLocation }: any) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return location ? <Marker position={[location.lat, location.lng]} icon={icon} /> : null;
}

export default function HospitalOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hospital Details
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [totalBeds, setTotalBeds] = useState(0);
  const [totalICUs, setTotalICUs] = useState(0);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  // Admin Details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Fleet
  const [fleet, setFleet] = useState<any[]>([{
    numberPlate: '',
    driverName: '',
    driverEmail: '',
    driverPassword: '',
    shift: '',
    idProofNumber: ''
  }]);

  const addVehicle = () => {
    setFleet([...fleet, { numberPlate: '', driverName: '', driverEmail: '', driverPassword: '', shift: '', idProofNumber: '' }]);
  };

  const updateFleet = (index: number, field: string, value: string) => {
    const newFleet = [...fleet];
    newFleet[index][field] = value;
    setFleet(newFleet);
  };

  const removeVehicle = (index: number) => {
    setFleet(fleet.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!location) {
      setError('Please select a hospital location on the map.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register-hospital', {
        adminName, adminEmail, adminPassword,
        hospitalName, hospitalAddress, hospitalPhone,
        lat: location.lat, lng: location.lng,
        totalBeds, totalICUs,
        fleet
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-8 text-white text-center border-b border-slate-800">
          <h2 className="text-3xl font-extrabold tracking-tight">Hospital Partner Onboarding</h2>
          <p className="mt-2 text-slate-400 font-medium">Join our emergency response network</p>
        </div>

        <div className="p-8">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">Admin Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={adminName} onChange={e => setAdminName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Admin Password</label>
                  <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required />
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-8">Hospital Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hospital Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={hospitalPhone} onChange={e => setHospitalPhone(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={hospitalAddress} onChange={e => setHospitalAddress(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Beds</label>
                  <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={totalBeds} onChange={e => setTotalBeds(parseInt(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total ICUs</label>
                  <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={totalICUs} onChange={e => setTotalICUs(parseInt(e.target.value) || 0)} required />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Hospital Location (Click to pin)</label>
                <div className="h-64 rounded-xl overflow-hidden border border-slate-300 shadow-sm relative z-0">
                  <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker location={location} setLocation={setLocation} />
                  </MapContainer>
                </div>
              </div>

              <button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl mt-8 transition-all shadow-sm active:scale-[0.98]">Next: Fleet & Drivers</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xl font-semibold">Fleet & Drivers</h3>
                <button onClick={addVehicle} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors border border-blue-200">+ Add Ambulance</button>
              </div>

              {fleet.map((vehicle, index) => (
                <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative shadow-sm">
                  {fleet.length > 1 && (
                    <button onClick={() => removeVehicle(index)} className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 font-extrabold text-lg p-2 transition-colors">X</button>
                  )}
                  <h4 className="font-bold mb-4">Ambulance #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Number Plate</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={vehicle.numberPlate} onChange={e => updateFleet(index, 'numberPlate', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Shift</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" placeholder="e.g. 9 AM - 5 PM" value={vehicle.shift} onChange={e => updateFleet(index, 'shift', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Driver Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={vehicle.driverName} onChange={e => updateFleet(index, 'driverName', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Driver Email</label>
                      <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={vehicle.driverEmail} onChange={e => updateFleet(index, 'driverEmail', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Driver ID Proof Number</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={vehicle.idProofNumber} onChange={e => updateFleet(index, 'idProofNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Driver Default Password</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white outline-none" value={vehicle.driverPassword} onChange={e => updateFleet(index, 'driverPassword', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]">
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
