CREATE TYPE user_role AS ENUM ('admin', 'hospital_staff', 'driver', 'citizen');
CREATE TYPE ambulance_status AS ENUM ('available', 'en_route', 'occupied', 'offline');
CREATE TYPE call_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  driver_id UUID REFERENCES users(id),
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  status ambulance_status NOT NULL DEFAULT 'offline',
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES users(id),
  caller_phone VARCHAR(50) NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT NOT NULL,
  status call_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES incident_calls(id),
  ambulance_id UUID NOT NULL REFERENCES ambulances(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pickup_eta_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambulance_id UUID NOT NULL REFERENCES ambulances(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
