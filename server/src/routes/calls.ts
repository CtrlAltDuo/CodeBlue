import { Router } from 'express';
import { pool } from '../db/pool';
import { autoDispatch } from '../services/dispatchEngine';
import { getIo } from '../socket';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { caller_phone, pickup_lat, pickup_lng, pickup_address, citizen_id } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO incident_calls (caller_phone, pickup_lat, pickup_lng, pickup_address, citizen_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [caller_phone, pickup_lat, pickup_lng, pickup_address, citizen_id || null]
    );
    
    const newCall = rows[0];
    
    try {
      const dispatchResult = await autoDispatch(newCall.id, pool);
      
      const io = getIo();
      io.to('admin').emit('call_assigned', { call: newCall, assignment: dispatchResult });
      io.to(`driver:${dispatchResult.ambulanceId}`).emit('call_assigned', { call: newCall, assignment: dispatchResult });
      
      res.status(201).json({ call: newCall, assignment: dispatchResult });
    } catch (dispatchError: any) {
      res.status(201).json({ call: newCall, error: dispatchError.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = `SELECT * FROM incident_calls WHERE 1=1`;
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
      query += ` AND created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
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
      `UPDATE incident_calls SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const io = getIo();
    io.to(`call:${id}`).emit('call_completed', rows[0]);
    io.to('admin').emit('call_completed', rows[0]);
    
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
