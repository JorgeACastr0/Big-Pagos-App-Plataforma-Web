const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Create database connection
const db = new sqlite3.Database('./bigpagos.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Promisify database operations for easier async/await usage
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database tables
function initializeDatabase() {
  const tables = [
    // Create admins table
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      hash_password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Create clients table
    `CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      activo BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Create invoices table
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      numero TEXT UNIQUE NOT NULL,
      monto_total INTEGER NOT NULL CHECK (monto_total >= 0),
      moneda TEXT NOT NULL DEFAULT 'COP',
      fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
      fecha_vencimiento DATE,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE CASCADE
    )`,

    // Create payments table
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL,
      monto INTEGER NOT NULL CHECK (monto >= 0),
      metodo TEXT NOT NULL DEFAULT 'PSE',
      wompi_id TEXT,
      estado TEXT NOT NULL DEFAULT 'iniciado',
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      raw_payload TEXT,
      FOREIGN KEY (factura_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`
  ];

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_clients_cedula ON clients(cedula)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_cliente ON invoices(cliente_id)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_estado ON invoices(estado)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_factura ON payments(factura_id)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_estado ON payments(estado)`
  ];

  // Execute all table creations sequentially
  let completed = 0;
  const total = tables.length + indexes.length;

  const executeNext = () => {
    if (completed < tables.length) {
      db.run(tables[completed], (err) => {
        if (err) {
          console.error(`Error creating table ${completed + 1}:`, err.message);
        } else {
          console.log(`Table ${completed + 1} created successfully`);
        }
        completed++;
        executeNext();
      });
    } else if (completed < total) {
      const indexIndex = completed - tables.length;
      db.run(indexes[indexIndex], (err) => {
        if (err) {
          console.error(`Error creating index ${indexIndex + 1}:`, err.message);
        } else {
          console.log(`Index ${indexIndex + 1} created successfully`);
        }
        completed++;
        executeNext();
      });
    } else {
      console.log('Database initialized successfully');
    }
  };

  executeNext();
}

// Helper functions for database operations
const dbHelpers = {
  // Admin operations
  createAdmin: (email, password, rol = 'admin') => {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return reject(err);

        db.run(
          'INSERT INTO admins (email, hash_password, rol) VALUES (?, ?, ?)',
          [email, hash, rol],
          function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, email, rol });
          }
        );
      });
    });
  },

  findAdminByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM admins WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  getAllAdmins: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, email, rol, created_at FROM admins', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // Invoice operations
  getAllInvoices: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT i.*, c.nombres, c.apellidos, c.cedula
        FROM invoices i
        JOIN clients c ON i.cliente_id = c.id
        ORDER BY i.created_at DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  createInvoice: (invoiceData) => {
    return new Promise((resolve, reject) => {
      const { cliente_id, numero, monto_total, moneda = 'COP', fecha_emision, fecha_vencimiento, estado = 'pendiente' } = invoiceData;
      db.run(
        'INSERT INTO invoices (cliente_id, numero, monto_total, moneda, fecha_emision, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cliente_id, numero, monto_total, moneda, fecha_emision || new Date().toISOString().split('T')[0], fecha_vencimiento, estado],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...invoiceData });
        }
      );
    });
  }
};

module.exports = { db, dbHelpers, dbRun, dbGet, dbAll };