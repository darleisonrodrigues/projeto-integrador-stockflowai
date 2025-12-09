const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Erro de validação',
            details: errors.array().map(e => e.msg)
        });
    }
    next();
};
