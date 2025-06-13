const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// Configuração do multer para upload de arquivos
const upload = multer({
    storage: multer.memoryStorage(), // Armazenar em memória
    limits: {
        fileSize: 50 * 1024 * 1024 // Limite de 50MB
    }
});

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authMiddleware, profileController.getCurrentUserProfile);

// @route   GET api/profile/message
// @desc    Get current user's saved message
// @access  Private
router.get('/message', authMiddleware, profileController.getUserMessage);

// @route   POST api/profile/message
// @desc    Save user's message
// @access  Private
router.post('/message', authMiddleware, profileController.saveUserMessage);

// @route   POST api/profile/contacts
// @desc    Save user's contacts
// @access  Private
router.post('/contacts', authMiddleware, profileController.saveUserContacts);

// @route   GET api/profile/contacts
// @desc    Get user's contacts
// @access  Private
router.get('/contacts', authMiddleware, profileController.getUserContacts);

// @route   GET api/profile/ia-status
// @desc    Get user's IA status
// @access  Private
router.get('/ia-status', authMiddleware, profileController.getIAStatus);

// @route   POST api/profile/ia-status
// @desc    Update user's IA status
// @access  Private
router.post('/ia-status', authMiddleware, profileController.updateIAStatus);

// @route   GET api/profile/config-status
// @desc    Get user's config interval
// @access  Private
router.get('/config-status', authMiddleware, profileController.getConfigStatus);

// @route   POST api/profile/config-status
// @desc    Update user's config interval
// @access  Private
router.post('/config-status', authMiddleware, profileController.updateConfigStatus);

// @route   GET api/profile/whatsapp/status
// @desc    Get current user's WhatsApp instance status
// @access  Private
router.get('/whatsapp/status', authMiddleware, profileController.getMyWhatsAppStatus);

// @route   GET api/profile/whatsapp/qr
// @desc    Get current user's WhatsApp QR Code
// @access  Private
router.get('/whatsapp/qr', authMiddleware, profileController.getMyWhatsAppQR);

// @route   POST api/profile/whatsapp/logout
// @desc    Logout current user's WhatsApp
// @access  Private
router.post('/whatsapp/logout', authMiddleware, profileController.logoutMyWhatsApp);

// @route   POST api/profile/whatsapp/create-instance
// @desc    Create current user's WhatsApp instance
// @access  Private
// COMENTADO: Não é mais necessário criar instância manualmente
// router.post('/whatsapp/create-instance', authMiddleware, profileController.createMyWhatsAppInstance);

// @route   POST api/profile/upload-media
// @desc    Upload media file to Hive Storage
// @access  Private
router.post('/upload-media', authMiddleware, upload.single('file'), profileController.uploadMedia);

// @route   GET api/profile/media
// @desc    Get user's media files
// @access  Private
router.get('/media', authMiddleware, profileController.getUserMedia);

// @route   DELETE api/profile/media/:id
// @desc    Delete media file from Hive Storage and database
// @access  Private
router.delete('/media/:id', authMiddleware, profileController.deleteMedia);

module.exports = router;
