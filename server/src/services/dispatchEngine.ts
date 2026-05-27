import { Pool, PoolClient } from 'pg';

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getNearestAvailableAmbulance(callLat: number, callLng: number, db: Pool | PoolClient) {
  const { rows } = await db.query(`SELECT id, current_lat, current_lng FROM ambulances WHERE status = 'available'`);
  if (rows.length === 0) return null;

  let nearest = rows[0];
  let minDistance = getHaversineDistance(callLat, callLng, nearest.current_lat, nearest.current_lng);

  for (let i = 1; i < rows.length; i++) {
    const distance = getHaversineDistance(callLat, callLng, rows[i].current_lat, rows[i].current_lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = rows[i];
    }
  }

  return { ambulance: nearest, distance: minDistance };
}

export async function assignAmbulance(callId: string, ambulanceId: string, distance: number, db: Pool | PoolClient) {
  const etaMinutes = Math.round((distance / 40) * 60);

  await db.query(`UPDATE ambulances SET status = 'en_route', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ambulanceId]);
  await db.query(`UPDATE incident_calls SET status = 'assigned' WHERE id = $1`, [callId]);
  
  const { rows } = await db.query(
    `INSERT INTO dispatch_assignments (call_id, ambulance_id, pickup_eta_minutes) VALUES ($1, $2, $3) RETURNING *`,
    [callId, ambulanceId, etaMinutes]
  );

  return rows[0];
}

export async function autoDispatch(callId: string, db: Pool | PoolClient) {
  const { rows: callRows } = await db.query(`SELECT pickup_lat, pickup_lng FROM incident_calls WHERE id = $1`, [callId]);
  if (callRows.length === 0) throw new Error('Call not found');
  
  const callLat = callRows[0].pickup_lat;
  const callLng = callRows[0].pickup_lng;

  const nearestResult = await getNearestAvailableAmbulance(callLat, callLng, db);
  if (!nearestResult) throw new Error('No ambulances available');

  const { ambulance, distance } = nearestResult;
  const assignment = await assignAmbulance(callId, ambulance.id, distance, db);

  return { ambulanceId: ambulance.id, assignment };
}
