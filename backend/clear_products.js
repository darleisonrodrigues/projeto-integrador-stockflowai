const db = require('./database');

console.log('Clearing all product and transaction data...');

const tablesToClear = [
    'stock_movements',
    'order_items',
    'sale_items',
    'product_suppliers',
    'orders',
    'sales',
    'products'
];

db.serialize(() => {
    // Disable FK enforcement temporarily if needed, or just delete in correct order.
    // SQLite enforces FK by default only if PRAGMA foreign_keys = ON; is set. 
    // Usually it's safer to delete in order.

    tablesToClear.forEach(table => {
        db.run(`DELETE FROM ${table}`, (err) => {
            if (err) {
                console.error(`Error clearing ${table}:`, err.message);
            } else {
                console.log(`Cleared table: ${table}`);
            }
        });
    });
});

// Wait briefly for operations to complete
setTimeout(() => {
    console.log('Database cleared of products and transactions.');
    process.exit(0);
}, 2000);
