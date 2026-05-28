import { Router } from 'express';
import { pool } from '../db/pool';
import { getRecommendedPrepositionZones } from '../jobs/ambulancePreposition';

const router = Router();

router.get('/response-times', async (req, res) => {
  try {
    const query = `
      SELECT 
        ROUND(i.pickup_lat::numeric, 2) AS district_lat,
        ROUND(i.pickup_lng::numeric, 2) AS district_lng,
        COUNT(i.id) as total_calls,
        AVG(EXTRACT(EPOCH FROM (d.completed_at - d.assigned_at))/60) as avg_response_min,
        MIN(EXTRACT(EPOCH FROM (d.completed_at - d.assigned_at))/60) as min_response_min,
        MAX(EXTRACT(EPOCH FROM (d.completed_at - d.assigned_at))/60) as max_response_min
      FROM incident_calls i
      JOIN dispatch_assignments d ON i.id = d.call_id
      WHERE i.status = 'completed' AND d.completed_at IS NOT NULL
      GROUP BY district_lat, district_lng
      ORDER BY total_calls DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/call-volume', async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM incident_calls
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ambulance-utilization', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.license_plate,
        a.status,
        COUNT(d.id) as total_completed_calls,
        AVG(EXTRACT(EPOCH FROM (d.completed_at - d.assigned_at))/60) as avg_en_route_min
      FROM ambulances a
      LEFT JOIN dispatch_assignments d ON a.id = d.ambulance_id AND d.completed_at IS NOT NULL
      GROUP BY a.id, a.license_plate, a.status
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/heatmap-data', async (req, res) => {
  try {
    const query = `
      SELECT 
        pickup_lat as lat,
        pickup_lng as lng,
        1 as count
      FROM incident_calls
      WHERE status = 'completed'
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/preposition-zones', async (req, res) => {
  try {
    const zones = await getRecommendedPrepositionZones();
    res.json(zones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
