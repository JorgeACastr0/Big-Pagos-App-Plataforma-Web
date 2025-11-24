const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// FINAL, FINAL, FINAL, DEFINITIVE CORRECTED FLOW: Using dynamically calculated SHA256 hash as per your instructions.
router.post('/wompi-link', async (req, res) => {
  console.log('Request to prepare Wompi form data received. Body:', req.body);
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId is required' });
  }

  try {
    // 1. Fetch invoice and client data
    const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceRes.rows[0];

    const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [invoice.cliente_id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const client = clientRes.rows[0];

    const cleanedPhoneNumber = client.telefono ? client.telefono.replace(/\D/g, '') : '';
    const reference = `bigpagos_inv_${invoice.id}_${Date.now()}`;
    const amountInCents = invoice.monto_total * 100;
    const currency = invoice.moneda;

    // 2. Dynamically generate the SHA256 hash
    const integrityKey = process.env.WOMPI_INTEGRITY_SECRET; // Your test_integrity_... key
    
    // --- CRITICAL FIX: Concatenation order as per your instructions ---
    const textToSign = `${reference}${amountInCents}${currency}${integrityKey}`;
    console.log('Text to sign for SHA-256 hash:', textToSign);

    const signature = crypto.createHash('sha256').update(textToSign).digest('hex');

    // 3. Prepare all data needed by the frontend
    const wompiFormParams = {
      'public-key': 'pub_test_7PHgC0EXcmpX4a6JOFuJbnzhbOR8ATOr',
      'signature:integrity': signature,
      'currency': currency,
      'amount-in-cents': amountInCents.toString(),
      'reference': reference,
      'redirect-url': 'http://www.bigdata.net.co/capture.php',

      // Customer data
      'customer-data:email': client.email,
      'customer-data:full-name': `${client.nombres} ${client.apellidos}`,
      'customer-data:phone-number': cleanedPhoneNumber,
      'customer-data:legal-id': client.cedula,
      'customer-data:legal-id-type': 'CC',
    };

    // 4. Send the complete key-value object to the frontend
    console.log('Sending form params to frontend:', wompiFormParams);
    res.status(200).json(wompiFormParams);

  } catch (error) {
    console.error('Failed to prepare Wompi form data:', error.message);
    res.status(500).json({ error: 'Failed to prepare Wompi form data' });
  }
});

module.exports = router;