import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import HospitalDashboard from './pages/HospitalDashboard';
import DriverApp from './pages/DriverApp';
import CitizenApp from './pages/CitizenApp';
import AdminMap from './pages/AdminMap';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, token } = useAuth();
  
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    if (user?.role === 'hospital_staff') return <Navigate to="/hospital" replace />;
    if (user?.role === 'driver') return <Navigate to="/driver" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin-map" replace />;
    return <Navigate to="/citizen" replace />;
  }
  
  return <>{children}</>;
}

function RootRoute() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  
  if (user.role === 'admin') return <Navigate to="/admin-map" replace />;
  if (user.role === 'hospital_staff') return <Navigate to="/hospital" replace />;
  if (user.role === 'driver') return <Navigate to="/driver" replace />;
  return <Navigate to="/citizen" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Unauthenticated routes without standard Layout navigation */}
            <Route path="/" element={<RootRoute />} />
            
            <Route element={<Layout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/citizen" element={<CitizenApp />} />
              
              <Route path="/admin-map" element={
                <ProtectedRoute role="admin">
                  <AdminMap />
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute role="admin">
                  <AnalyticsDashboard />
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
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
