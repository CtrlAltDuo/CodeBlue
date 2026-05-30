import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40 dark:opacity-60">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 dark:bg-red-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 dark:bg-blue-600/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center min-h-screen">
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

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl mb-16">
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

        <div className="animate-bounce mt-10 text-slate-400">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </main>

      {/* How it Works Section */}
      <section className="relative z-10 py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              How <span className="text-red-600">CodeBlue</span> Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Every second counts in an emergency. Our platform simplifies the dispatch process to ensure help arrives immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/40 rounded-3xl flex items-center justify-center transform -rotate-6">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. Drop a Pin</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Simply open the app, enter your phone number, and drop a location pin. No confusing menus or questions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/40 rounded-3xl flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Smart Dispatch</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our AI scans the entire city grid to find and instantly assign the absolute closest available ambulance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/40 rounded-3xl flex items-center justify-center transform rotate-6">
                <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Real-Time Tracking</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Watch your ambulance approach live on the map. Get the driver's name, vehicle plate, and exact ETA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Previews Section */}
      <section className="relative z-10 py-24 bg-slate-100 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-3xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden">
                 <img src="/superadmin.png" alt="Admin Dashboard" className="w-full h-auto" />
              </div>
            </div>
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Complete Command Center
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Our admin dashboard provides a God's-eye view of your entire city's emergency fleet. Track every active incident, monitor ambulance battery and availability, and manage multiple hospitals from a single screen.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Live Fleet Tracking
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Hospital Bed & ICU Management
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Instant Analytics
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mt-32">
            <div className="w-full lg:w-1/2">
              <div className="w-full max-w-sm mx-auto bg-slate-200 dark:bg-slate-800 rounded-[3rem] border-8 border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden">
                 <img src="/user_mobile.png" alt="Citizen App" className="w-full h-auto" />
              </div>
            </div>
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Built for Citizens in Crisis
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                The Citizen App is designed to be frictionless. In an emergency, nobody has time to navigate menus. Just one tap to request an ambulance and immediate, transparent updates on its arrival.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  No Registration Required
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Live Map Integration
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  2-Minute Instant Reassignment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why CodeBlue?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
               <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center mb-6">
                 <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Smart Routing</h4>
               <p className="text-slate-600 dark:text-slate-400 text-sm">
                 Uses advanced Haversine formulas to calculate exact distances over the Earth's surface for absolute accuracy.
               </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
               <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6">
                 <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               </div>
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Multi-Hospital Network</h4>
               <p className="text-slate-600 dark:text-slate-400 text-sm">
                 Unifies disjointed hospital fleets into a single, cohesive emergency grid. All beds and ICUs tracked live.
               </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
               <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-6">
                 <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
               </div>
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Dedicated Driver App</h4>
               <p className="text-slate-600 dark:text-slate-400 text-sm">
                 Drivers get a tailored GPS app that forces strict availability tracking, reducing manual dispatch errors.
               </p>
            </div>
            {/* Feature 4 */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-6">
                 <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Instant Reassignment</h4>
               <p className="text-slate-600 dark:text-slate-400 text-sm">
                 If an ambulance gets stuck in traffic, citizens can instantly reassign to the next closest unit within a 2-minute window.
               </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-12 relative z-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
           <div>
              <h3 className="font-bold text-white text-xl mb-4"><span className="text-red-500">Code</span>Blue</h3>
              <p className="text-sm">Building the future of emergency medical response infrastructure.</p>
           </div>
           <div>
              <h4 className="font-bold text-slate-300 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                 <li><Link to="/citizen" className="hover:text-white transition-colors">Citizen App</Link></li>
                 <li><Link to="/login" className="hover:text-white transition-colors">Driver App</Link></li>
                 <li><Link to="/login" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-slate-300 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                 <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
           </div>
           <div>
              <h4 className="font-bold text-slate-300 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                 <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
           </div>
        </div>
        <div className="text-center text-sm pt-8 border-t border-slate-800">
          &copy; {new Date().getFullYear()} CodeBlue Emergency Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
