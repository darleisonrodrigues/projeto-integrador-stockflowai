const db = require('../database');
const crypto = require('crypto');

exports.create = (req, res) => {
    const { items, totalAmount, notes, clientId, status } = req.body;
    // items: [{ productId, quantity, unitPrice }]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'A venda deve conter pelo menos um item.' });
    }

    const saleId = crypto.randomUUID();
    const date = new Date().toISOString();
    const finalStatus = status || 'COMPLETED'; // Default to COMPLETED if not provided

    const sqlSale = `INSERT INTO sales (id, date, totalAmount, notes, clientId, status) VALUES (?, ?, ?, ?, ?, ?)`;

    // We need to execute a transaction effectively. SQLite serialize ensures sequential execution.
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(sqlSale, [saleId, date, totalAmount, notes, clientId, finalStatus], (err) => {
            if (err) {
                console.error('Error creating sale:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            let completedItems = 0;
            let hasError = false;

            items.forEach((item) => {
                if (hasError) return;

                const itemId = crypto.randomUUID();
                const sqlItem = `INSERT INTO sale_items (id, saleId, productId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)`;

                db.run(sqlItem, [itemId, saleId, item.productId, item.quantity, item.unitPrice], (err) => {
                    if (err) {
                        hasError = true;
                        console.error('Error inserting sale item:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Erro ao salvar itens da venda.' });
                    }

                    const proceed = () => {
                        completedItems++;
                        if (completedItems === items.length && !hasError) {
                            db.run('COMMIT');
                            res.status(201).json({ message: finalStatus === 'QUOTE' ? 'Orçamento salvo com sucesso!' : 'Venda registrada com sucesso!', id: saleId });
                        }
                    };

                    if (finalStatus === 'COMPLETED') {
                        // Deduct stock only if COMPLETED
                        const sqlUpdateStock = `UPDATE products SET quantity = quantity - ? WHERE id = ?`;
                        db.run(sqlUpdateStock, [item.quantity, item.productId], (err) => {
                            if (err) {
                                hasError = true;
                                console.error('Error updating stock:', err);
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Erro ao atualizar estoque.' });
                            }

                            // Log Stock Movement (OUT)
                            const movementId = crypto.randomUUID();
                            const sqlMovement = `INSERT INTO stock_movements (id, productId, type, quantity, date) VALUES (?, ?, 'OUT', ?, ?)`;
                            db.run(sqlMovement, [movementId, item.productId, item.quantity, date], (err) => {
                                if (err) console.error('Error logging movement:', err);
                            });

                            proceed();
                        });
                    } else {
                        // If Quote, do not deduct stock
                        proceed();
                    }
                });
            });
        });
    });
};

exports.list = (req, res) => {
    const sql = `
        SELECT s.*, c.name as clientName,
               (SELECT json_group_array(json_object('productId', si.productId, 'productName', p.name, 'quantity', si.quantity, 'unitPrice', si.unitPrice))
                FROM sale_items si
                LEFT JOIN products p ON si.productId = p.id
                WHERE si.saleId = s.id) as items
        FROM sales s
        LEFT JOIN clients c ON s.clientId = c.id
        ORDER BY s.date DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Parse the JSON string from SQLite for items
        const sales = rows.map(row => ({
            ...row,
            items: row.items ? JSON.parse(row.items) : []
        }));

        res.json(sales);
    });
};
