const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware to verify JWT (kept for other routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get invoices by client cedula (public) or all invoices (admin)
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: cedula
 *         schema:
 *           type: string
 *         description: The client's cedula to filter invoices.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/', async (req, res) => {
  const { cedula } = req.query;

  // Public query by cedula
  if (cedula) {
    try {
      const result = await pool.query(`
        SELECT i.*, c.nombres, c.apellidos, c.cedula
        FROM invoices i
        JOIN clients c ON i.cliente_id = c.id
        WHERE c.cedula = $1
        ORDER BY i.created_at DESC
      `, [cedula]);
      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // If no cedula, it must be an authenticated admin request
  // We re-apply the authentication logic here manually for this specific case
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    
    // Authenticated admin fetching all invoices
    try {
      const result = await pool.query(`
        SELECT i.*, c.nombres, c.apellidos, c.cedula
        FROM invoices i
        JOIN clients c ON i.cliente_id = c.id
        ORDER BY i.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});


/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - numero
 *               - monto_total
 *             properties:
 *               cliente_id:
 *                 type: string
 *               numero:
 *                 type: string
 *               monto_total:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/', authenticateToken, async (req, res) => {
  const { cliente_id, numero, monto_total, moneda = 'COP', fecha_emision, fecha_vencimiento, estado = 'pendiente' } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO invoices (cliente_id, numero, monto_total, moneda, fecha_emision, fecha_vencimiento, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [cliente_id, numero, monto_total, moneda, fecha_emision || new Date().toISOString().split('T')[0], fecha_vencimiento, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Invoice number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Invoice updated
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { numero, monto_total, moneda, fecha_emision, fecha_vencimiento, estado } = req.body;

  try {
    let query = 'UPDATE invoices SET ';
    const values = [];
    const updates = [];

    if (numero) {
      updates.push('numero = $' + (values.length + 1));
      values.push(numero);
    }
    if (monto_total !== undefined) {
      updates.push('monto_total = $' + (values.length + 1));
      values.push(monto_total);
    }
    if (moneda) {
      updates.push('moneda = $' + (values.length + 1));
      values.push(moneda);
    }
    if (fecha_emision) {
      updates.push('fecha_emision = $' + (values.length + 1));
      values.push(fecha_emision);
    }
    if (fecha_vencimiento) {
      updates.push('fecha_vencimiento = $' + (values.length + 1));
      values.push(fecha_vencimiento);
    }
    if (estado) {
      updates.push('estado = $' + (values.length + 1));
      values.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += updates.join(', ') + ' WHERE id = $' + (values.length + 1) + ' RETURNING *';
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Invoice deleted
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;