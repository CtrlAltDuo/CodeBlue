import { pool } from '../db/pool';

export async function getRecommendedPrepositionZones() {
  const query = `
    SELECT 
      ROUND(pickup_lat::numeric, 2) AS lat,
      ROUND(pickup_lng::numeric, 2) AS lng,
      COUNT(*) AS call_count
    FROM incident_calls
    WHERE status = 'completed'
    GROUP BY ROUND(pickup_lat::numeric, 2), ROUND(pickup_lng::numeric, 2)
    ORDER BY call_count DESC
    LIMIT 5
  `;
  const { rows } = await pool.query(query);
  return rows.map(r => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    call_count: parseInt(r.call_count, 10)
  }));
}
