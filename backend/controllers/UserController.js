const db = require('../database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.list = (req, res) => {
    db.all("SELECT id, name, email, role, active FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.create = (req, res) => {
    const { name, email, password, role } = req.body;
    const id = crypto.randomUUID();

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    // Explicitly set role, default to EMPLOYEE if invalid
    const validRole = ['ADMIN', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE';

    db.run(
        "INSERT INTO users (id, name, email, password, role, active) VALUES (?, ?, ?, ?, ?, 1)",
        [id, name, email, hashedPassword, validRole],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email já cadastrado.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id, name, email, role: validRole, active: 1 });
        }
    );
};

exports.update = (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
    }

    const validRole = ['ADMIN', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE';

    // Password update logic is separate (resetPassword) or could be included here if needed.
    // For now, focusing on profile details. If password is sent, we ignore it to avoid accidental plain-text saves or complex logic here.
    // Use resetPassword endpoint for password changes.

    db.run(
        "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
        [name, email, validRole, id],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email já cadastrado.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Usuário atualizado com sucesso.', user: { id, name, email, role: validRole } });
        }
    );
};

exports.toggleActive = (req, res) => {
    const { id } = req.params;
    const { active } = req.body; // Expect boolean or 1/0

    db.run("UPDATE users SET active = ? WHERE id = ?", [active ? 1 : 0, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status do usuário atualizado.' });
    });
};

exports.resetPassword = (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Nova senha obrigatória.' });

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Senha redefinida com sucesso.' });
    });
};

exports.delete = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuário excluído com sucesso.' });
    });
};
