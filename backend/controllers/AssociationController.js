const db = require('../database');

exports.associate = (req, res) => {
    const { productId, supplierId } = req.body;

    if (!productId || !supplierId) {
        return res.status(400).json({ error: 'Produto e Fornecedor são obrigatórios.' });
    }

    const sql = `INSERT INTO product_suppliers (productId, supplierId) VALUES (?, ?)`;

    db.run(sql, [productId, supplierId], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Fornecedor já está associado a este produto!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Fornecedor associado com sucesso ao produto!' });
    });
};

exports.disassociate = (req, res) => {
    const { productId, supplierId } = req.params;

    const sql = `DELETE FROM product_suppliers WHERE productId = ? AND supplierId = ?`;

    db.run(sql, [productId, supplierId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Associação não encontrada.' });
        }
        res.json({ message: 'Fornecedor desassociado com sucesso!' });
    });
};

exports.getSuppliersByProduct = (req, res) => {
    const { productId } = req.params;
    const sql = `
        SELECT s.* 
        FROM suppliers s
        JOIN product_suppliers ps ON s.id = ps.supplierId
        WHERE ps.productId = ?
    `;
    db.all(sql, [productId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
}
