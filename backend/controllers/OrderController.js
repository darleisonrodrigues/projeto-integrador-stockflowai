const db = require('../database');
const crypto = require('crypto');

exports.create = (req, res) => {
    const { supplierId, items, totalAmount } = req.body; // items: [{ productId, quantity, unitPrice }]
    const orderId = crypto.randomUUID();
    const date = new Date().toISOString();
    const status = 'PENDING';

    if (!supplierId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Fornecedor e itens são obrigatórios.' });
    }

    const sqlOrder = `INSERT INTO orders (id, supplierId, status, date, totalAmount) VALUES (?, ?, ?, ?, ?)`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(sqlOrder, [orderId, supplierId, status, date, totalAmount], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const sqlItem = `INSERT INTO order_items (id, orderId, productId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)`;
            let completedItems = 0;

            items.forEach(item => {
                const itemId = crypto.randomUUID();
                db.run(sqlItem, [itemId, orderId, item.productId, item.quantity, item.unitPrice], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    completedItems++;
                    if (completedItems === items.length) {
                        db.run('COMMIT');
                        res.status(201).json({ message: 'Pedido criado com sucesso!', id: orderId });
                    }
                });
            });
        });
    });
};

exports.list = (req, res) => {
    // Get orders with supplier name
    const sql = `
        SELECT o.*, s.companyName as supplierName 
        FROM orders o 
        JOIN suppliers s ON o.supplierId = s.id 
        ORDER BY o.date DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // For each order, get items (Not super efficient N+1 but fine for SQLite/MVP)
        // A better way would be a separate query or aggregation, but let's keep it simple
        const orders = rows;
        let processed = 0;

        if (orders.length === 0) return res.json([]);

        orders.forEach(order => {
            db.all(`SELECT oi.*, p.name as productName FROM order_items oi JOIN products p ON oi.productId = p.id WHERE orderId = ?`, [order.id], (err, items) => {
                if (err) {
                    // Log error but continue? Ideally handle better
                    console.error(err);
                }
                order.items = items;
                processed++;
                if (processed === orders.length) {
                    res.json(orders);
                }
            });
        });
    });
};

exports.receive = (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
        if (order.status !== 'PENDING') return res.status(400).json({ error: 'Este pedido já foi processado.' });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 1. Update Order Status
            db.run(`UPDATE orders SET status = 'COMPLETED' WHERE id = ?`, [id], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // 2. Get Items to update stock
                db.all(`SELECT * FROM order_items WHERE orderId = ?`, [id], (err, items) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    // 3. For each item, update product quantity and log movement
                    let processedItems = 0;
                    items.forEach(item => {
                        // Update Product
                        db.run(`UPDATE products SET quantity = quantity + ? WHERE id = ?`, [item.quantity, item.productId]);

                        // Log Movement
                        const moveId = crypto.randomUUID();
                        const date = new Date().toISOString();
                        db.run(`INSERT INTO stock_movements (id, productId, type, quantity, date) VALUES (?, ?, ?, ?, ?)`,
                            [moveId, item.productId, 'IN', item.quantity, date]);

                        processedItems++;
                        if (processedItems === items.length) {
                            db.run('COMMIT');
                            res.json({ message: 'Pedido recebido e estoque atualizado!' });
                        }
                    });
                });
            });
        });
    });
};

exports.update = (req, res) => {
    const { id } = req.params;
    const { supplierId, items, totalAmount } = req.body;

    if (!supplierId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Fornecedor e itens são obrigatórios.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 1. Update Order basics
        db.run(`UPDATE orders SET supplierId = ?, totalAmount = ? WHERE id = ?`, [supplierId, totalAmount, id], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            // 2. Delete existing items
            db.run(`DELETE FROM order_items WHERE orderId = ?`, [id], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // 3. Insert new items
                const sqlItem = `INSERT INTO order_items (id, orderId, productId, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)`;
                let completedItems = 0;

                items.forEach(item => {
                    const itemId = crypto.randomUUID();
                    db.run(sqlItem, [itemId, id, item.productId, item.quantity, item.unitPrice], function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }
                        completedItems++;
                        if (completedItems === items.length) {
                            db.run('COMMIT');
                            res.json({ message: 'Pedido atualizado com sucesso!' });
                        }
                    });
                });
            });
        });
    });
};

exports.delete = (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const proceedToDelete = () => {
                // 1. Delete Items
                db.run(`DELETE FROM order_items WHERE orderId = ?`, [id], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    // 2. Delete Order
                    db.run(`DELETE FROM orders WHERE id = ?`, [id], function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }
                        db.run('COMMIT');
                        res.json({ message: 'Pedido excluído com sucesso!' });
                    });
                });
            };

            if (order.status === 'COMPLETED') {
                // If order was completed, reverse stock additions
                db.all(`SELECT * FROM order_items WHERE orderId = ?`, [id], (err, items) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    let processed = 0;
                    if (items.length === 0) {
                        proceedToDelete();
                    } else {
                        items.forEach(item => {
                            db.run(`UPDATE products SET quantity = quantity - ? WHERE id = ?`, [item.quantity, item.productId], (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: err.message });
                                }
                                processed++;
                                if (processed === items.length) {
                                    proceedToDelete();
                                }
                            });
                        });
                    }
                });
            } else {
                proceedToDelete();
            }
        });
    });
};
