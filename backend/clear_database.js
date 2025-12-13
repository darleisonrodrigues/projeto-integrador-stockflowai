const db = require('./database');

console.log('Clearing ALL database data (users, suppliers, products, etc)...');

const tablesToClear = [
    'sale_items',
    'sales',
    'order_items',
    'orders',
    'stock_movements',
    'product_suppliers',
    'products',
    'suppliers',
    'clients',
    'settings',
    'users'
];

db.serialize(() => {
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

setTimeout(() => {
    console.log('Database completely wiped.');
    process.exit(0);
}, 2000);
