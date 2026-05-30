# CodeBlue

Real-time ambulance dispatch and emergency response optimization platform with live tracking, ETA prediction, hospital fleet management, and intelligent nearest-unit assignment.

## Tech Stack
- **Client**: React, Vite, TypeScript, TailwindCSS, Mappls Web Maps, Recharts, Socket.io-client
- **Server**: Node.js, Express, TypeScript, PostgreSQL, Socket.io
- **Monorepo**: npm workspaces, concurrently

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CtrlAltDuo/CodeBlue.git
   cd CodeBlue
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   This project uses a centralized cloud PostgreSQL database (via Supabase). You do not need to run a local PostgreSQL instance.

4. **Environment variables**:
   Create `.env` files in both `client` and `server` folders using the examples provided.

   **`client/.env`**:
   ```env
   VITE_MAPPLS_API_KEY=your_mappls_key_here
   VITE_API_URL=http://localhost:5000
   ```

   **`server/.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-SUPABASE-PROJECT-ID].supabase.co:5432/postgres
   JWT_SECRET=your_jwt_secret
   MAPPLS_API_KEY=your_mappls_key_here
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

5. **Run development servers**:
   ```bash
   npm run dev
   ```

## User Roles & Navigation

- **Citizen**: Accessible at `/citizen`. Request emergency services, track ambulance ETA, and view live location via Mappls SDK. No login required.
- **Admin**: Accessible at `/admin-map` (Dispatch map with hotspot toggle) and `/analytics` (Performance charts, 30-day volume, utilization metrics).
- **Hospital Staff**: Accessible at `/hospital`. Manage hospital ambulances and view dispatch status.
- **Driver**: Accessible at `/driver`. Interface for accepting calls and navigating.

## API Health Check
You can verify the backend is running and connected to the database by visiting: `GET http://localhost:5000/health`
