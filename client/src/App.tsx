import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import HospitalDashboard from './pages/HospitalDashboard';
import DriverApp from './pages/DriverApp';
import CitizenApp from './pages/CitizenApp';
import AdminMap from './pages/AdminMap';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, token } = useAuth();
  
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    if (user?.role === 'hospital_staff') return <Navigate to="/hospital" replace />;
    if (user?.role === 'driver') return <Navigate to="/driver" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin-map" replace />;
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/citizen" element={<CitizenApp />} />
          
          <Route path="/admin-map" element={
            <ProtectedRoute role="admin">
              <AdminMap />
            </ProtectedRoute>
          } />
          
          <Route path="/hospital" element={
            <ProtectedRoute role="hospital_staff">
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/driver" element={
            <ProtectedRoute role="driver">
              <DriverApp />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
