import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    return regex.test(password);
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Invalid email format.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }
    setError('');
    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm max-w-md w-full border border-slate-200 dark:border-slate-800 transition-colors">
        <h1 className="text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-8 transition-colors">Create Account</h1>
        {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 transition-colors">Full Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 transition-colors">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 transition-colors">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
              placeholder="Min 8 characters"
            />
            {password && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  {[1, 2, 3, 4, 5].map((level) => {
                    let strength = 0;
                    if (password.length >= 8) strength++;
                    if (/[a-z]/.test(password)) strength++;
                    if (/[A-Z]/.test(password)) strength++;
                    if (/\d/.test(password)) strength++;
                    if (/[\W_]/.test(password)) strength++;
                    
                    let color = 'bg-transparent';
                    if (strength >= level) {
                      if (strength <= 2) color = 'bg-red-500';
                      else if (strength === 3 || strength === 4) color = 'bg-yellow-500';
                      else color = 'bg-emerald-500';
                    }
                    
                    return <div key={level} className={`h-full flex-1 border-r border-white/20 last:border-r-0 transition-colors duration-300 ${color}`} />;
                  })}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(() => {
                     let s = 0;
                     if (password.length >= 8) s++;
                     if (/[a-z]/.test(password)) s++;
                     if (/[A-Z]/.test(password)) s++;
                     if (/\d/.test(password)) s++;
                     if (/[\W_]/.test(password)) s++;
                     if (s <= 2) return 'Weak: Add uppercase, numbers, or symbols';
                     if (s <= 4) return 'Good: Could be stronger';
                     return 'Strong: Great password!';
                  })()}
                </p>
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Register
          </button>
        </form>
        <p className="mt-6 text-center text-slate-600 dark:text-slate-400 transition-colors">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors">Sign In</Link>
        </p>
        <p className="mt-2 text-center text-slate-600 dark:text-slate-400 transition-colors">
          Are you a hospital? <Link to="/hospital-onboarding" className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors">Register your hospital</Link>
        </p>
      </div>
    </div>
  );
}
