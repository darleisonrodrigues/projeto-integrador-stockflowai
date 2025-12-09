const db = require('../database');
const crypto = require('crypto');

exports.list = (req, res) => {
    db.all('SELECT * FROM clients ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.create = (req, res) => {
    const { name, document, phone, email, zipCode, street, number, neighborhood, city, state, type } = req.body;
    const id = crypto.randomUUID();

    if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

    const sql = `INSERT INTO clients (id, name, document, phone, email, zipCode, street, number, neighborhood, city, state, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, name, document, phone, email, zipCode, street, number, neighborhood, city, state, type || 'PF'], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Cliente cadastrado com sucesso!', id });
    });
};

exports.update = (req, res) => {
    const { id } = req.params;
    const { name, document, phone, email, zipCode, street, number, neighborhood, city, state, type } = req.body;

    const sql = `UPDATE clients SET name = ?, document = ?, phone = ?, email = ?, zipCode = ?, street = ?, number = ?, neighborhood = ?, city = ?, state = ?, type = ? WHERE id = ?`;

    db.run(sql, [name, document, phone, email, zipCode, street, number, neighborhood, city, state, type, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente atualizado com sucesso!' });
    });
};

exports.delete = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM clients WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente excluído com sucesso!' });
    });
};
