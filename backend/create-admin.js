const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createAdmin() {
  const email = 'admin@bigpagos.com';
  const password = 'admin123';

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully!');

    // Guardar contraseña sin hash por ahora
    const result = await client.query(
      'INSERT INTO admins (email, hash_password, rol) VALUES ($1, $2, $3) RETURNING id, email, rol',
      [email, password, 'admin']
    );

    console.log('Admin created successfully:', result.rows[0]);
    console.log('Email:', email);
    console.log('Password:', password);

    client.release();
  } catch (error) {
    console.error('Error creating admin:', error.message);
    if (error.code === '23505') {
      console.log('Admin already exists with this email');
    }
  } finally {
    await pool.end();
  }
}

createAdmin();