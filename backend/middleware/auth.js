const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey'; // Fallback apenas para dev, mas ideal é forçar erro se faltar
if (!process.env.JWT_SECRET) {
    console.warn("⚠️  AVISO: JWT_SECRET não definido no .env. Usando chave insegura de desenvolvimento.");
}

// Middleware para verificar se o usuário está logado
exports.verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    if (!token) {
        return res.status(403).json({ auth: false, message: 'Nenhum token fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).json({ auth: false, message: 'Falha ao autenticar token.' });
        }

        // Salvar na requisição para uso em outras rotas
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Middleware para verificar se o usuário é Admin
exports.isAdmin = (req, res, next) => {
    if (req.userRole === 'ADMIN') {
        next();
        return;
    }
    res.status(403).json({ message: 'Requer privilégios de Administrador!' });
};
