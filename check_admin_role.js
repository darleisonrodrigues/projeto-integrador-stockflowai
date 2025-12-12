const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/stockflow.db', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to SQlite.');
});

db.serialize(() => {
    db.each("SELECT id, name, email, role FROM users WHERE email = 'admin@stockflow.com'", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(`User: ${row.email}, Role: ${row.role}`);
    });
});

db.close();
