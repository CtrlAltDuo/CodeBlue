import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40 dark:opacity-60">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 dark:bg-red-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 dark:bg-blue-600/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 mb-8 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 transition-colors">
          <span className="text-red-600 dark:text-red-500">Code</span>Blue
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed transition-colors">
          Intelligent emergency response platform. Connecting citizens with the fastest available life-saving care.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl">
          <Link 
            to="/citizen"
            className="group relative w-full flex items-center justify-center px-8 py-5 text-xl font-bold text-white bg-red-600 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:bg-red-500 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <span className="relative flex items-center gap-3">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              I NEED AN AMBULANCE
            </span>
          </Link>
          
          <Link 
            to="/login"
            className="w-full sm:w-auto shrink-0 px-8 py-5 text-lg font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 text-center shadow-sm"
          >
            Staff Portal
          </Link>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 relative z-10 text-sm font-medium">
        &copy; {new Date().getFullYear()} CodeBlue Emergency Systems. All rights reserved.
      </footer>
    </div>
  );
}
