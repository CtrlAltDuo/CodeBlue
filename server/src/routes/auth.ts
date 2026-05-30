import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!validateEmail(email)) { res.status(400).json({ error: 'Invalid email format' }); return; }
    if (!validatePassword(password)) { res.status(400).json({ error: 'Password must be strong' }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const validatePassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/.test(password);
const validatePhone = (phone: string) => /^\+?[\d\s-]{10,15}$/.test(phone);
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateNumberPlate = (plate: string) => /^[A-Z0-9\s-]{6,15}$/i.test(plate);

router.post('/register-hospital', async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { 
      adminName, adminEmail, adminPassword, 
      hospitalName, hospitalAddress, hospitalPhone, lat, lng, 
      totalBeds, totalICUs, fleet 
    } = req.body;

    if (!validateEmail(adminEmail)) { res.status(400).json({ error: 'Invalid admin email format' }); return; }
    if (!validatePassword(adminPassword)) { res.status(400).json({ error: 'Admin password must be strong' }); return; }
    if (!validatePhone(hospitalPhone)) { res.status(400).json({ error: 'Invalid hospital phone number format' }); return; }
    
    if (fleet && Array.isArray(fleet)) {
      for (let i = 0; i < fleet.length; i++) {
        const v = fleet[i];
        if (!validateNumberPlate(v.numberPlate)) { res.status(400).json({ error: `Ambulance #${i+1} has an invalid number plate format` }); return; }
        if (!validateEmail(v.driverEmail)) { res.status(400).json({ error: `Ambulance #${i+1} driver email is invalid` }); return; }
        if (!validatePassword(v.driverPassword)) { res.status(400).json({ error: `Ambulance #${i+1} driver password must be strong` }); return; }
      }
    }

    await client.query('BEGIN');

    const hospitalResult = await client.query(
      `INSERT INTO hospitals (name, address, lat, lng, contact_phone, total_beds, available_beds, total_icus, available_icus)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [hospitalName, hospitalAddress, lat, lng, hospitalPhone, totalBeds, totalBeds, totalICUs, totalICUs]
    );
    const hospitalId = hospitalResult.rows[0].id;

    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const adminResult = await client.query(
      'INSERT INTO users (name, email, password_hash, role, hospital_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [adminName, adminEmail, adminPasswordHash, 'hospital_staff', hospitalId]
    );

    if (fleet && Array.isArray(fleet)) {
      for (const vehicle of fleet) {
        const driverPasswordHash = await bcrypt.hash(vehicle.driverPassword, 10);
        const driverResult = await client.query(
          'INSERT INTO users (name, email, password_hash, role, hospital_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [vehicle.driverName, vehicle.driverEmail, driverPasswordHash, 'driver', hospitalId]
        );
        const driverId = driverResult.rows[0].id;

        await client.query(
          'INSERT INTO driver_details (user_id, shift, id_proof_number) VALUES ($1, $2, $3)',
          [driverId, vehicle.shift, vehicle.idProofNumber]
        );

        await client.query(
          'INSERT INTO ambulances (hospital_id, driver_id, license_plate, current_lat, current_lng) VALUES ($1, $2, $3, $4, $5)',
          [hospitalId, driverId, vehicle.numberPlate, lat, lng]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Hospital registered successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.sendStatus(401);
      return;
    }
    const result = await pool.query(
      'SELECT id, name, email, role, hospital_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      res.sendStatus(404);
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
