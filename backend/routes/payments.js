const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const axios = require('axios'); // <--- NUEVA DEPENDENCIA

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 1. Endpoint para PREPARAR el pago (sin cambios)
router.post('/wompi-link', async (req, res) => {
  console.log('Request to prepare Wompi form data received. Body:', req.body);
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId is required' });
  }

  try {
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
    const integrityKey = process.env.WOMPI_INTEGRITY_SECRET;
    const textToSign = `${reference}${amountInCents}${currency}${integrityKey}`;
    const signature = crypto.createHash('sha256').update(textToSign).digest('hex');

    const wompiFormParams = {
      'public-key': 'pub_test_7PHgC0EXcmpX4a6JOFuJbnzhbOR8ATOr',
      'signature:integrity': signature,
      'currency': currency,
      'amount-in-cents': amountInCents.toString(),
      'reference': reference,
      'redirect-url': 'http://www.bigdata.net.co/capture.php', // <-- Correcto
      'customer-data:email': client.email,
      'customer-data:full-name': `${client.nombres} ${client.apellidos}`,
      'customer-data:phone-number': cleanedPhoneNumber,
      'customer-data:legal-id': client.cedula,
      'customer-data:legal-id-type': 'CC',
    };

    res.status(200).json(wompiFormParams);

  } catch (error) {
    console.error('Failed to prepare Wompi form data:', error.message);
    res.status(500).json({ error: 'Failed to prepare Wompi form data' });
  }
});


// 2. NUEVO Endpoint para VERIFICAR el estado de una transacción
router.get('/status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  console.log(`Checking status for Wompi transaction: ${transactionId}`);

  try {
    // Consultamos la API de Wompi
    const wompiApiUrl = `https://sandbox.wompi.co/v1/transactions/${transactionId}`;
    const wompiResponse = await axios.get(wompiApiUrl);
    
    const transaction = wompiResponse.data.data;

    // Si la transacción fue aprobada, actualizamos nuestra base de datos
    if (transaction.status === 'APPROVED') {
      console.log(`Transaction ${transaction.id} was APPROVED.`);
      const reference = transaction.reference;
      const invoiceId = reference.split('_')[2];

      if (invoiceId) {
        console.log(`Updating invoice ${invoiceId} to \'pagada\'...`);
        await pool.query(
          'UPDATE invoices SET estado = $1 WHERE id = $2 AND estado != $1',
          ['pagada', invoiceId]
        );
        console.log(`Invoice ${invoiceId} successfully updated.`);
      } else {
         console.error('Could not parse invoiceId from reference:', reference);
      }
    }

    // Enviamos el estado final a la app móvil
    res.status(200).json({ status: transaction.status, message: 'Status checked' });

  } catch (error) {
    console.error('Error checking Wompi transaction status:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
});


module.exports = router;