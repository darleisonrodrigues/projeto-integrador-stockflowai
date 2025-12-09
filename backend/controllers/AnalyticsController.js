const db = require('../database');

exports.getAnalytics = (req, res) => {
    const { period } = req.query; // 'weekly' or 'monthly'

    let groupBy, limit;
    if (period === 'monthly') {
        // Last 4 weeks (approx month)
        // SQLite doesn't have great date functions, so we'll fetch raw data and process in JS for simplicity
        limit = 30;
    } else {
        // Weekly (last 7 days)
        limit = 7;
    }

    const sql = `SELECT * FROM stock_movements ORDER BY date DESC LIMIT 1000`; // Fetch recent movements

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Process data in JS
        const now = new Date();
        const dataMap = {};

        // Initialize map with empty data for the period
        for (let i = 0; i < limit; i++) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('fr-CA'); // YYYY-MM-DD in local time
            dataMap[dateStr] = { date: dateStr, in: 0, out: 0 };
        }

        rows.forEach(row => {
            // Convert UTC string from DB to Date object, then to local date string
            const rowDate = new Date(row.date);
            const dateStr = rowDate.toLocaleDateString('fr-CA');

            if (dataMap[dateStr]) {
                if (row.type === 'IN') {
                    dataMap[dateStr].in += row.quantity;
                } else if (row.type === 'OUT') {
                    dataMap[dateStr].out += row.quantity;
                }
            }
        });

        // Convert to array and sort by date
        const result = Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(result);
    });
};
