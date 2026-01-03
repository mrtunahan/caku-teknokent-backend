const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); // Middleware'i ekledik

// -- HERKESİN ERİŞEBİLECEĞİ ROTALAR (Public) --
router.post('/applications', projectController.createApplication); // Başvuru yapmak herkese açık olmalı

// -- SADECE YÖNETİCİLERİN ERİŞEBİLECEĞİ ROTALAR (Protected) --
// Araya 'protect' ekleyerek şifreli hale getirdik
router.get('/applications', protect, projectController.getAllApplications);
router.get('/applications/:id', protect, projectController.getApplicationById);
router.get('/applications/search/email', protect, projectController.searchByEmail);
router.get('/applications/search/tc', protect, projectController.searchByTC);
router.put('/applications/:id', protect, projectController.updateApplication);
router.patch('/applications/:id/status', protect, projectController.updateApplicationStatus);
router.delete('/applications/:id', protect, projectController.deleteApplication);
router.get('/statistics/summary', protect, projectController.getStatistics);
router.get('/statistics/by-field', protect, projectController.getApplicationsByField);
router.get('/applications/export/excel', protect, projectController.exportProjectsExcel);

module.exports = router;