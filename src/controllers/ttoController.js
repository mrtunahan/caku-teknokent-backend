const TtoService = require('../models/TtoService');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

exports.getAll = async (req, res) => {
    try {
        const services = await TtoService.findAll({ order: [['createdAt', 'ASC']] });
        res.json({ success: true, data: services });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.create = async (req, res) => {
    try {
        const { title, description, iconKey, colorTheme, items } = req.body;
        // items frontend'den array olarak gelmeli
        const service = await TtoService.create({ 
            title, description, iconKey, colorTheme, items 
        });
        res.status(201).json({ success: true, data: service });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.update = async (req, res) => {
    try {
        const service = await TtoService.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Bulunamadı' });
        
        await service.update(req.body);
        res.json({ success: true, data: service });
    } catch (error) {
        return handleError(error, res, 500);
    }
};

exports.delete = async (req, res) => {
    try {
        const service = await TtoService.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Bulunamadı' });
        
        await service.destroy();
        res.json({ success: true, message: 'Silindi' });
    } catch (error) {
        return handleError(error, res, 500);
    }
};