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

3. **Environment variables**:
   Copy the example environment files and fill in your keys:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

4. **Run development servers**:
   ```bash
   npm run dev
   ```

## User Roles

- **Admin**: System oversight and management.
- **Hospital Staff**: Manage hospital ambulances and view dispatch status.
- **Driver**: Ambulance driver interface for accepting calls and navigating.
- **Citizen**: Request emergency services and track ambulance ETA.
