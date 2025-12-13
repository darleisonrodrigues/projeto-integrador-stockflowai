const db = require('./database');

console.log('Updating product expiry dates to NULL...');

db.run(`UPDATE products SET expiryDate = NULL`, function (err) {
    if (err) {
        console.error('Error updating products:', err.message);
    } else {
        console.log(`Success! Updated ${this.changes} products.`);
    }
    // Close the database connection properly implies waiting for the loop event but here we just exit after a timeout or let it close naturally if db object handles it. 
    // SQLite3 default mode keeps it open. We can explicit close or just let script finish.
    // However, db.run is async.

    // We can't easily close `db` here because `database.js` exports an open connection and doesn't export a close method easily, but we can try.
    // Actually `database.js` exports the db instance.

    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
