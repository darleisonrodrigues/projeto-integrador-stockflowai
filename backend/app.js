require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { validate } = require('./middleware/validation');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swaggerConfig');

// Controladores
const SupplierController = require('./controllers/SupplierController');
const ProductController = require('./controllers/ProductController');
const AssociationController = require('./controllers/AssociationController');
const AuthController = require('./controllers/AuthController');
const OrderController = require('./controllers/OrderController');
const SalesController = require('./controllers/SalesController');
const ClientController = require('./controllers/ClientController');
const SettingsController = require('./controllers/SettingsController');
const UserController = require('./controllers/UserController');
const AnalyticsController = require('./controllers/AnalyticsController');

// Middleware
const authMiddleware = require('./middleware/auth');

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)!'));
        }
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware da Aplicação
app.use(helmet({
    contentSecurityPolicy: false, // Necessário para carregar scripts externos (Tailwind CDN) e imagens
}));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Permitir carregar imagens

// Rate Limiting (Limitação de taxa de requisições)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.'
});
app.use(limiter);

// Configuração CORS Segura
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        // Normalize: remove trailing slash for comparison
        const cleanOrigin = origin.replace(/\/$/, '');
        const cleanAllowed = allowedOrigins.map(url => url.replace(/\/$/, ''));

        if (cleanAllowed.indexOf(cleanOrigin) === -1) {
            // "Resolva de uma vez por todas": Allow any Railway app domain
            // This prevents errors if the user changes the project name or URL
            if (cleanOrigin.endsWith('.railway.app')) {
                return callback(null, true);
            }

            console.error(`CORS Blocked: ${origin}. Allowed: ${allowedOrigins}`);
            var msg = 'A política CORS para este site não permite acesso da origem especificada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- Rotas Públicas ---
app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.post('/auth/google', AuthController.googleLogin);
app.post('/forgot-password', AuthController.forgotPassword);

// --- Rotas Protegidas ---
// Todas as rotas abaixo requerem um token válido (authMiddleware.verifyToken)

// Atalho para Middleware de Admin
const adminOnly = [authMiddleware.verifyToken, authMiddleware.isAdmin];
const protectedRoute = [authMiddleware.verifyToken];

// Rotas de Fornecedores
/**
// Rotas de Fornecedores
/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Lista todos os fornecedores
 *     tags: [Fornecedores]
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso
 *   post:
 *     summary: Cria um novo fornecedor
 *     tags: [Fornecedores]
 *     responses:
 *       201:
 *         description: Criado com sucesso
 */
app.post('/suppliers', protectedRoute, SupplierController.create);
app.get('/suppliers', protectedRoute, SupplierController.getAll);
app.put('/suppliers/:id', protectedRoute, SupplierController.update);
app.delete('/suppliers/:id', adminOnly, SupplierController.delete); // Admin Only

// Rotas de Produtos
app.post('/products',
    protectedRoute,
    upload.single('image'),
    [
        body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
        body('barcode').trim().notEmpty().withMessage('Código de barras é obrigatório'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantidade deve ser um número positivo'),
        body('category').trim().notEmpty().withMessage('Categoria é obrigatória')
    ],
    validate,
    ProductController.create
);


/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Sucesso
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Produtos]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         description: Imagem do produto
 *     responses:
 *       201:
 *         description: Produto criado
 */
app.get('/products', protectedRoute, ProductController.getAll);
app.put('/products/:id', protectedRoute, upload.single('image'), ProductController.update);
app.delete('/products/:id', adminOnly, ProductController.delete); // Admin Only

// Rotas de Associação
app.post('/associations', protectedRoute, AssociationController.associate);
app.delete('/associations', protectedRoute, AssociationController.disassociate);
app.delete('/products/:productId/suppliers/:supplierId', protectedRoute, AssociationController.disassociate);
app.get('/products/:productId/suppliers', protectedRoute, AssociationController.getSuppliersByProduct);

// Rotas de Pedidos
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lista pedidos de compra
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *   post:
 *     summary: Cria novo pedido
 *     tags: [Pedidos]
 *     responses:
 *       201:
 *         description: Pedido criado
 */
app.post('/orders', protectedRoute, OrderController.create);
app.get('/orders', protectedRoute, OrderController.list);
app.post('/orders/:id/receive', protectedRoute, OrderController.receive);
app.put('/orders/:id', protectedRoute, OrderController.update);
app.delete('/orders/:id', adminOnly, OrderController.delete); // Admin Only

// Rotas de Vendas
app.post('/sales', protectedRoute, SalesController.create);
app.get('/sales', protectedRoute, SalesController.list);

// Rotas de Clientes
app.get('/clients', protectedRoute, ClientController.list);
app.post('/clients', protectedRoute, ClientController.create);
app.put('/clients/:id', protectedRoute, ClientController.update);
app.delete('/clients/:id', adminOnly, ClientController.delete); // Admin Only

// Rotas de Configurações (Apenas Admin)
app.get('/api/settings', adminOnly, SettingsController.getSettings);
app.post('/api/settings', adminOnly, SettingsController.updateSettings);
app.get('/api/backup/download', adminOnly, SettingsController.downloadBackup);
app.post('/api/backup/restore', adminOnly, SettingsController.uploadBackup);

// Rotas de Gerenciamento de Usuários (Apenas Admin)
app.get('/users', adminOnly, UserController.list);
app.post('/users', adminOnly, UserController.create);
app.put('/users/:id', adminOnly, UserController.update);
app.patch('/users/:id/status', adminOnly, UserController.toggleActive);
app.post('/users/:id/reset-password', adminOnly, UserController.resetPassword);
app.delete('/users/:id', adminOnly, UserController.delete);

// Rotas de Analytics (Apenas Admin)
app.get('/analytics', protectedRoute, AnalyticsController.getAnalytics);

// Tratamento de erros de Upload (Multer)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erro de Upload: ${err.message}` });
    } else if (err) {
        // Log do erro real no servidor (seguro)
        console.error("🔥 Erro do Servidor:", err);

        // Se for erro conhecido de validação (ex: arquivo inválido), retorna msg
        if (err.message === 'Apenas imagens são permitidas (jpeg, jpg, png, gif)!') {
            return res.status(400).json({ error: err.message });
        }

        // Caso contrário, erro genérico para não vazar info
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
    next();
});

// Serve Static Frontend (Production)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback: Any route not handled by API returns index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}/`);
    console.log(`Security: Helmet & Rate Limit enabled.`);
    console.log(`CORS Allowed Origins: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
