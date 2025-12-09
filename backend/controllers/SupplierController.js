const db = require('../database');
const crypto = require('crypto');

exports.create = (req, res) => {
    const { companyName, cnpj, phone, address, email, contactName } = req.body;
    const id = crypto.randomUUID();

    if (!companyName || !cnpj || !phone || !address || !email || !contactName) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = `INSERT INTO suppliers (id, companyName, cnpj, phone, address, email, contactName) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, companyName, cnpj, phone, address, email, contactName];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed: suppliers.cnpj')) {
                return res.status(400).json({ error: 'Fornecedor com esse CNPJ já está cadastrado!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Fornecedor cadastrado com sucesso!', id });
    });
};

exports.getAll = (req, res) => {
    const sql = `SELECT * FROM suppliers`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};

exports.update = (req, res) => {
    const { id } = req.params;
    const { companyName, cnpj, phone, address, email, contactName } = req.body;

    if (!companyName || !cnpj || !phone || !address || !email || !contactName) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = `UPDATE suppliers SET companyName = ?, cnpj = ?, phone = ?, address = ?, email = ?, contactName = ? WHERE id = ?`;
    const params = [companyName, cnpj, phone, address, email, contactName, id];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed: suppliers.cnpj')) {
                return res.status(400).json({ error: 'Fornecedor com esse CNPJ já está cadastrado!' });
            }
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }
        res.json({ message: 'Fornecedor atualizado com sucesso!' });
    });
};

exports.delete = (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM suppliers WHERE id = ?`;

    db.run(sql, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }
        res.json({ message: 'Fornecedor removido com sucesso!' });
    });
};
