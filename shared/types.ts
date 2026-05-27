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

export enum AmbulanceStatus {
  AVAILABLE = 'AVAILABLE',
  EN_ROUTE = 'EN_ROUTE',
  OCCUPIED = 'OCCUPIED',
  OFFLINE = 'OFFLINE',
}

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

export enum CallStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

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
