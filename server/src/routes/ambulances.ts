import { Router } from 'express';
import { pool } from '../db/pool';
import { getIo } from '../socket';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { hospital_id } = req.query;
    let query = 'SELECT * FROM ambulances WHERE 1=1';
    const params: any[] = [];

    if (hospital_id) {
      params.push(hospital_id);
      query += ` AND hospital_id = $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { rows } = await pool.query(
      `UPDATE ambulances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, callId } = req.body;

    const { rows } = await pool.query(
      `UPDATE ambulances SET current_lat = $1, current_lng = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [lat, lng, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    await pool.query(
      `INSERT INTO location_history (ambulance_id, lat, lng) VALUES ($1, $2, $3)`,
      [id, lat, lng]
    );

    const io = getIo();
    const updateData = { ambulanceId: id, lat, lng, callId };
    
    io.to('admin').emit('location_update', updateData);
    if (callId) {
      io.to(`call:${callId}`).emit('location_update', updateData);
    }
    
    const { rows: hospitalRows } = await pool.query(`SELECT hospital_id FROM ambulances WHERE id = $1`, [id]);
    if (hospitalRows.length > 0) {
      io.to(`hospital:${hospitalRows[0].hospital_id}`).emit('location_update', updateData);
    }

    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
