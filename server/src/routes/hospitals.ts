import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/nearby', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }
    
    // Simple Haversine distance calculation in SQL
    // 6371 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) + sin(radians(lat1)) * sin(radians(lat2)))
    const query = `
      SELECT h.*, 
        (6371 * acos(cos(radians($1)) * cos(radians(h.lat)) * cos(radians(h.lng) - radians($2)) + sin(radians($1)) * sin(radians(h.lat)))) AS distance
      FROM hospitals h
      ORDER BY distance ASC
      LIMIT 10
    `;
    const result = await pool.query(query, [lat, lng]);
    const hospitals = result.rows;

    // Fetch ambulances for these hospitals to calculate ETA
    const hospitalIds = hospitals.map(h => h.id);
    let ambulances: any[] = [];
    if (hospitalIds.length > 0) {
      const ambResult = await pool.query(
        'SELECT * FROM ambulances WHERE hospital_id = ANY($1) AND status = $2',
        [hospitalIds, 'available']
      );
      ambulances = ambResult.rows;
    }

    // Attach ETA to hospitals based on closest available ambulance
    const hospitalsWithETA = hospitals.map(h => {
      const hospAmbulances = ambulances.filter(a => a.hospital_id === h.id);
      let eta = null;
      if (hospAmbulances.length > 0) {
        // Find closest ambulance
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        let minDistance = Infinity;
        for (const amb of hospAmbulances) {
           const dLat = (amb.current_lat - userLat) * (Math.PI / 180);
           const dLng = (amb.current_lng - userLng) * (Math.PI / 180);
           const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                     Math.cos(userLat * (Math.PI / 180)) * Math.cos(amb.current_lat * (Math.PI / 180)) *
                     Math.sin(dLng / 2) * Math.sin(dLng / 2);
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
           const distance = 6371 * c;
           if (distance < minDistance) minDistance = distance;
        }
        // Basic ETA: 1.5 mins per km
        eta = Math.max(1, Math.round(minDistance * 1.5));
      }
      return { ...h, eta };
    });

    res.json(hospitalsWithETA);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM hospitals WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/inventory', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { available_beds, available_icus } = req.body;
    const { id } = req.params;
    
    // ensure the user is hospital staff
    if ((req as any).user.role !== 'hospital_staff') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    const result = await pool.query(
      'UPDATE hospitals SET available_beds = $1, available_icus = $2 WHERE id = $3 RETURNING *',
      [available_beds, available_icus, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
