const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'stockflow.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Tabela de Fornecedores
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      contactName TEXT NOT NULL
    )`);

    // Tabela de Produtos
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      category TEXT NOT NULL,
      expiryDate TEXT,
      imageUrl TEXT
    )`);

    // Tabela de Associação Produto-Fornecedor
    db.run(`CREATE TABLE IF NOT EXISTS product_suppliers (
      productId TEXT NOT NULL,
      supplierId TEXT NOT NULL,
      PRIMARY KEY (productId, supplierId),
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (supplierId) REFERENCES suppliers(id)
    )`);

    // Tabela de Usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'EMPLOYEE', -- 'ADMIN' ou 'EMPLOYEE'
      active INTEGER DEFAULT 1 -- 1 (verdadeiro) ou 0 (falso)
    )`);

    // Tabela de Movimentações de Estoque
    db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      type TEXT NOT NULL, -- 'IN' (entrada) ou 'OUT' (saída)
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    // Tabela de Pedidos (Pedidos de Compra)
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      supplierId TEXT NOT NULL,
      status TEXT NOT NULL, -- 'PENDING', 'COMPLETED', 'CANCELLED'
      date TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id)
    )`);

    // Tabela de Itens do Pedido
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    // Tabela de Vendas
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      status TEXT DEFAULT 'COMPLETED', -- 'QUOTE' or 'COMPLETED'
      date TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )`);

    // Tabela de Itens da Venda
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    // Tabela de Clientes (CRM)
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT, -- CPF/CNPJ
      phone TEXT,
      email TEXT,
      zipCode TEXT,
      street TEXT,
      number TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      type TEXT DEFAULT 'PF' -- PF or PJ
    )`);

    // Tabela de Configurações
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        value TEXT -- Valor JSON
    )`);
  });
}

module.exports = db;
