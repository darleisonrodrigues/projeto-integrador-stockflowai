import sqlite3 from 'sqlite3';
import { resolve } from 'path';

const dbPath = resolve('./backend/stockflow.db');
const db = new sqlite3.Database(dbPath);

console.log('Fixing Admin Role...');

db.serialize(() => {
    db.run("UPDATE users SET role = 'ADMIN' WHERE email = 'admin@stockflow.com'", function (err) {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`Updated ${this.changes} rows. Admin is now ADMIN.`);
        }
        db.close();
    });
});
