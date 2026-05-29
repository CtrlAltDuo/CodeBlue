export type Role = 'admin' | 'hospital_staff' | 'driver' | 'citizen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contact_phone: string;
}

export type AmbulanceStatus = 'AVAILABLE' | 'EN_ROUTE' | 'OCCUPIED' | 'OFFLINE';

export interface Ambulance {
  id: string;
  hospital_id: string;
  driver_id: string;
  license_plate: string;
  status: AmbulanceStatus;
  current_lat: number;
  current_lng: number;
  updated_at: Date;
}

export type CallStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IncidentCall {
  id: string;
  citizen_id: string;
  caller_phone: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  status: CallStatus;
}

export interface DispatchAssignment {
  id: string;
  call_id: string;
  ambulance_id: string;
  assigned_at: Date;
  pickup_eta_minutes: number;
  completed_at: Date | null;
}
