const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authMiddleware, profileController.getCurrentUserProfile);

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
router.post('/whatsapp/create-instance', authMiddleware, profileController.createMyWhatsAppInstance);

module.exports = router;
