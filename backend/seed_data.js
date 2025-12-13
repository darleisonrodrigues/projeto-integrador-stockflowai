const db = require('./database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const suppliers = [
    { name: 'TechDistributor SA', cnpj: '12.345.678/0001-90', phone: '11987654321', email: 'contato@techdist.com' },
    { name: 'Global Imports Ltda', cnpj: '98.765.432/0001-10', phone: '21987654321', email: 'sales@globalimports.com' },
    { name: 'FastLogistics', cnpj: '45.678.123/0001-55', phone: '31987654321', email: 'support@fastlog.com' },
    { name: 'MegaAtacado', cnpj: '11.222.333/0001-44', phone: '41987654321', email: 'vendas@megaatacado.com.br' }
];

const products = [
    { name: 'Notebook Dell XPS', category: 'Eletrônicos', price: 8500, quantity: 15, supplierIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=400&q=80' },
    { name: 'Monitor LG Ultrawide', category: 'Eletrônicos', price: 1200, quantity: 25, supplierIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80' },
    { name: 'Teclado Mecânico Keychron', category: 'Periféricos', price: 600, quantity: 50, supplierIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1587829741301-308231c8db62?auto=format&fit=crop&w=400&q=80&t=2' },
    { name: 'Mouse Logitech MX Master', category: 'Periféricos', price: 450, quantity: 40, supplierIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cadeira Ergonômica Herman', category: 'Móveis', price: 3500, quantity: 8, supplierIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80' },
    { name: 'Mesa Elevatória', category: 'Móveis', price: 1800, quantity: 12, supplierIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Smartphone Samsung S24', category: 'Smartphones', price: 5000, quantity: 20, supplierIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Iphone 15 Pro', category: 'Smartphones', price: 7000, quantity: 18, supplierIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=400&q=80' },
    { name: 'Fone Sony WH-1000XM5', category: 'Áudio', price: 2200, quantity: 30, supplierIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&q=80' },
    { name: 'Caixa de Som JBL', category: 'Áudio', price: 800, quantity: 60, supplierIndex: 3, imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80' }
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    console.log('Seeding disabled by user request. Database will remain empty.');
    // All seeding logic removed/commented out to ensure clean slate.
}

seed();
