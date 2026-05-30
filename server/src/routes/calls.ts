import { Router } from 'express';
import { pool } from '../db/pool';
import { autoDispatch } from '../services/dispatchEngine';
import { getIo } from '../socket';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { caller_phone, pickup_lat, pickup_lng, pickup_address, citizen_id } = req.body;
    
    // Validate phone number is 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!caller_phone || !phoneRegex.test(caller_phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }

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

router.post('/:id/reassign', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current assignment to find the old ambulance
    const { rows: currAssignmentRows } = await pool.query(
      `SELECT * FROM dispatch_assignments WHERE call_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
      [id]
    );
    
    if (currAssignmentRows.length === 0) {
      return res.status(404).json({ error: 'No active assignment found to reassign.' });
    }
    
    // Validate 2 minute window
    const assignedAt = new Date(currAssignmentRows[0].assigned_at).getTime();
    if (Date.now() - assignedAt > 120 * 1000) {
      return res.status(400).json({ error: 'Reassignment window (2 minutes) has expired.' });
    }

    const currentAmbulanceId = currAssignmentRows[0].ambulance_id;
    
    try {
      const dispatchResult = await autoDispatch(id, pool, currentAmbulanceId);
      
      // If successful, free up the old ambulance
      await pool.query(`UPDATE ambulances SET status = 'available' WHERE id = $1`, [currentAmbulanceId]);
      
      const io = getIo();
      io.to('admin').emit('call_assigned', { call: { id }, assignment: dispatchResult });
      io.to(`driver:${dispatchResult.ambulanceId}`).emit('call_assigned', { call: { id }, assignment: dispatchResult });
      // Notify old driver to cancel dispatch
      io.to(`driver:${currentAmbulanceId}`).emit('call_cancelled', { callId: id });
      
      res.status(200).json({ assignment: dispatchResult });
    } catch (dispatchError: any) {
      // If no other ambulances are available, the user keeps the current one.
      if (dispatchError.message === 'No ambulances available') {
         // Fetch rich metadata for the current ambulance so UI can keep it
         const { rows: richRows } = await pool.query(`
            SELECT a.license_plate, u.name as driver_name, h.name as hospital_name, h.address as hospital_address
            FROM ambulances a
            LEFT JOIN users u ON a.driver_id = u.id
            LEFT JOIN hospitals h ON a.hospital_id = h.id
            WHERE a.id = $1
          `, [currentAmbulanceId]);
         const richData = richRows[0] || {};
         return res.status(400).json({ 
           error: 'No other ambulances available, keeping current assignment.',
           assignment: { ambulanceId: currentAmbulanceId, assignment: { ...currAssignmentRows[0], ...richData } }
         });
      }
      res.status(500).json({ error: dispatchError.message });
    }
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
