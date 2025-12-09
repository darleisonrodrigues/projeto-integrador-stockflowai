const db = require('../database');
const path = require('path');
const fs = require('fs');

exports.getSettings = (req, res) => {
    db.get("SELECT value FROM settings WHERE id = 'company_profile'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json({});
        res.json(JSON.parse(row.value));
    });
};

exports.updateSettings = (req, res) => {
    console.log('Receiving settings update:', req.body);
    const settings = req.body;
    db.run("INSERT OR REPLACE INTO settings (id, value) VALUES ('company_profile', ?)", [JSON.stringify(settings)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Configurações salvas com sucesso!' });
    });
};

exports.downloadBackup = (req, res) => {
    const dbPath = path.resolve(__dirname, '../stockflow.db');
    res.download(dbPath, `stockflow-backup-${new Date().toISOString().split('T')[0]}.db`, (err) => {
        if (err) {
            console.error('Error downloading backup:', err);
        }
    });
};

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.uploadBackup = [
    upload.single('backup'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const dbPath = path.resolve(__dirname, '../stockflow.db');
        const backupPath = req.file.path;

        // Close existing DB connection if possible? 
        // In this simple setup with SQLite and Node, replacing the file while running might be risky.
        // A safer approach for this lightweight app:
        // 1. Copy uploaded file to stockflow.db
        // 2. Recommend user restarting the server (or just handle it gracefully)

        fs.copyFile(backupPath, dbPath, (err) => {
            fs.unlinkSync(backupPath); // Cleanup upload

            if (err) return res.status(500).json({ error: 'Erro ao restaurar backup: ' + err.message });

            res.json({ message: 'Backup restaurado com sucesso! Recarregue a página para ver os dados.' });
        });
    }
];
