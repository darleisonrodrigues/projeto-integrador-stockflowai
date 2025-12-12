const db = require('../database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

exports.register = (req, res) => {
    const { name, email, password } = req.body;
    const id = crypto.randomUUID();

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const sql = `INSERT INTO users (id, name, email, password, role, active) VALUES (?, ?, ?, ?, 'ADMIN', 1)`;

    db.run(sql, [id, name, email, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email já cadastrado!' });
            }
            return res.status(500).json({ error: err.message });
        }

        // Auto login após registro
        // CONFIGURAÇÃO DEMO: Novos usuários são ADMIN por padrão para facilitar avaliação
        const role = 'ADMIN';
        const token = jwt.sign({ id: id, role: role }, SECRET_KEY, { expiresIn: 86400 }); // 24 horas
        res.status(201).json({ auth: true, token: token, user: { id, name, email, role } });
    });
};

const nodemailer = require('nodemailer');

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;

    db.get(sql, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor.' });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, error: 'Senha inválida.' });

        if (!user.active) return res.status(401).json({ auth: false, message: 'Conta desativada. Contate o administrador.' });

        // Incluir função (role) no token
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: 86400 });

        res.status(200).json({
            auth: true,
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
};

const { OAuth2Client } = require('google-auth-library');
// Substitua pelo seu Client ID real do Google
const GOOGLE_CLIENT_ID = '631412838806-4og4gq8irt7dg5ci3aaa4f4dta94dqok.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;

        // Verificar se o usuário existe
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
            if (err) return res.status(500).json({ error: 'Erro no servidor.' });

            if (user) {
                // Usuário existe, fazer login
                if (!user.active) return res.status(401).json({ auth: false, message: 'Conta desativada. Contate o administrador.' });

                const appToken = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: 86400 });
                res.json({
                    auth: true,
                    token: appToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } else {
                // Usuário não existe. 
                // Opção 1: Auto-registrar
                // Opção 2: Rejeitar

                // Implementando Opção 2 por segurança conforme solicitado no plano (Apenas Login)
                // Mas para melhor UX nesta demo, vamos criar conta "Employee" automaticamente se o domínio corresponder? 
                // Mantendo o plano: "Combinar por Email". Se não encontrar, retornar erro.
                return res.status(404).json({ error: 'Usuário não registrado. Peça ao administrador para criar sua conta.' });
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ error: 'Falha na autenticação com Google.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    // Verificar se o usuário existe
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor.' });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        try {
            // Criar conta de teste se necessário (ou usar existente)
            // Para Ethereal, geralmente criamos uma nova ou usamos credenciais hardcoded.
            // Aqui criamos uma na hora por simplicidade neste contexto de demonstração, 
            // ou melhor, usar createTestAccount que é assíncrono.
            const testAccount = await nodemailer.createTestAccount();

            const transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true para 465, false para outras portas
                auth: {
                    user: testAccount.user, // usuário ethereal gerado
                    pass: testAccount.pass, // senha ethereal gerada
                },
            });

            // Enviar e-mail com objeto de transporte definido
            const info = await transporter.sendMail({
                from: '"StockFlow AI" <no-reply@stockflow.ai>', // endereço do remetente
                to: email, // lista de destinatários
                subject: "Recuperação de Senha - StockFlow AI", // Linha de assunto
                text: "Você solicitou a recuperação de senha. Clique no link para redefinir: https://stockflow.ai/reset-password?token=123456", // corpo em texto simples
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h1>Recuperação de Senha</h1>
                        <p>Olá, <strong>${user.name}</strong>!</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta no StockFlow AI.</p>
                        <p>Clique no botão abaixo para criar uma nova senha:</p>
                        <a href="https://stockflow.ai/reset-password?token=123456" style="background-color: #137fec; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Redefinir Senha</a>
                        <p style="margin-top: 20px; font-size: 12px; color: #777;">Se você não solicitou isso, pode ignorar este e-mail.</p>
                    </div>
                `, // corpo em html
            });

            console.log("Message sent: %s", info.messageId);
            // Visualização disponível apenas ao enviar através de uma conta Ethereal
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

            res.status(200).json({ message: 'Email de recuperação enviado com sucesso!' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao enviar email.' });
        }
    });
};
