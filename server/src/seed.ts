import { pool } from './db/pool';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE location_history, dispatch_assignments, incident_calls, ambulances, driver_details, users, hospitals CASCADE');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin User
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('System Admin', 'admin@codeblue.com', $1, 'admin')
    `, [passwordHash]);

    // 2. Create Hospitals
    const hospitalValues = [
      ['City General Hospital', '123 Main St, New Delhi', 28.6139, 77.2090, '011-12345678', 500, 120, 50, 15],
      ['Max Super Speciality', 'Saket, New Delhi', 28.5273, 77.2166, '011-87654321', 800, 200, 100, 30],
      ['Apollo Hospital', 'Sarita Vihar, New Delhi', 28.5285, 77.2842, '011-55556666', 600, 150, 80, 25]
    ];

    const hospitalIds = [];
    for (const [name, address, lat, lng, phone, tb, ab, ti, ai] of hospitalValues) {
      const res = await pool.query(`
        INSERT INTO hospitals (name, address, lat, lng, contact_phone, total_beds, available_beds, total_icus, available_icus)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [name, address, lat, lng, phone, tb, ab, ti, ai]);
      hospitalIds.push(res.rows[0].id);
    }

    // 3. Create Hospital Staff
    for (let i = 0; i < hospitalIds.length; i++) {
      await pool.query(`
        INSERT INTO users (name, email, password_hash, role, hospital_id)
        VALUES ($1, $2, $3, 'hospital_staff', $4)
      `, [`Staff User ${i+1}`, `staff${i+1}@codeblue.com`, passwordHash, hospitalIds[i]]);
    }

    // 4. Create Drivers & Ambulances
    const driverIds = [];
    for (let i = 0; i < 5; i++) {
      const res = await pool.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, 'driver') RETURNING id
      `, [`Driver ${i+1}`, `driver${i+1}@codeblue.com`, passwordHash]);
      
      const driverId = res.rows[0].id;
      driverIds.push(driverId);

      await pool.query(`
        INSERT INTO driver_details (user_id, shift, id_proof_number)
        VALUES ($1, 'Day', $2)
      `, [driverId, `DL-0${i+1}-2026`]);

      const hospitalId = hospitalIds[i % hospitalIds.length];
      // Distribute ambulances slightly around the hospitals
      const hLat = hospitalValues[i % hospitalIds.length][2] as number;
      const hLng = hospitalValues[i % hospitalIds.length][3] as number;
      const aLat = hLat + (Math.random() * 0.02 - 0.01);
      const aLng = hLng + (Math.random() * 0.02 - 0.01);

      await pool.query(`
        INSERT INTO ambulances (hospital_id, driver_id, license_plate, status, current_lat, current_lng)
        VALUES ($1, $2, $3, 'available', $4, $5)
      `, [hospitalId, driverId, `DL-1C-AA${1000 + i}`, aLat, aLng]);
    }

    // 5. Create one active incident call so dashboard has data
    const callRes = await pool.query(`
      INSERT INTO incident_calls (caller_phone, pickup_lat, pickup_lng, pickup_address, status)
      VALUES ('9876543210', 28.6200, 77.2100, 'Connaught Place, New Delhi', 'assigned') RETURNING id
    `);

    // Make the first ambulance occupied and assign it
    const ambRes = await pool.query(`
      UPDATE ambulances SET status = 'en_route' 
      WHERE driver_id = $1 RETURNING id
    `, [driverIds[0]]);
    
    await pool.query(`
      INSERT INTO dispatch_assignments (call_id, ambulance_id, pickup_eta_minutes)
      VALUES ($1, $2, 5)
    `, [callRes.rows[0].id, ambRes.rows[0].id]);

    console.log('Database seeded successfully!');
    console.log('--- LOGIN CREDENTIALS ---');
    console.log('Password for all users: password123');
    console.log('Admin: admin@codeblue.com');
    console.log('Staff 1: staff1@codeblue.com');
    console.log('Driver 1: driver1@codeblue.com');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding db:', error);
    process.exit(1);
  }
}

seed();
