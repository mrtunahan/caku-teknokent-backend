const Support = require('../models/Support');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

exports.getAll = async (req, res) => {
    try {
        const supports = await Support.findAll();
        res.json({ success: true, data: supports });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.create = async (req, res) => {
    try {
        const support = await Support.create(req.body);
        res.status(201).json({ success: true, data: support });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.update = async (req, res) => {
    try {
        const support = await Support.findByPk(req.params.id);
        if (!support) return res.status(404).json({ message: 'Bulunamadı' });
        await support.update(req.body);
        res.json({ success: true, data: support });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.delete = async (req, res) => {
    try {
        const support = await Support.findByPk(req.params.id);
        if (!support) return res.status(404).json({ message: 'Bulunamadı' });
        await support.destroy();
        res.json({ success: true, message: 'Silindi' });
    } catch (error) {
        return handleError(error, res, 500);
    }
};