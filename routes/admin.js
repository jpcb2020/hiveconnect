const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', adminAuth, adminController.getDashboard);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', adminAuth, adminController.getAllUsers);

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/users', adminAuth, adminController.createUser);

// @route   PUT /api/admin/users/:id
// @desc    Update user (name, email, role)
// @access  Private (Admin only)
router.put('/users/:id', adminAuth, adminController.updateUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', adminAuth, adminController.updateUserRole);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// ===== WhatsApp Management Routes =====

// @route   GET /api/admin/whatsapp/instances
// @desc    List all WhatsApp instances
// @access  Private (Admin only)
router.get('/whatsapp/instances', adminAuth, adminController.getWhatsAppInstances);

// @route   GET /api/admin/whatsapp/status/:email
// @desc    Get WhatsApp instance status for a user
// @access  Private (Admin only)
router.get('/whatsapp/status/:email', adminAuth, adminController.getWhatsAppStatus);

// @route   POST /api/admin/whatsapp/create-instance
// @desc    Manually create WhatsApp instance for existing user
// @access  Private (Admin only)
router.post('/whatsapp/create-instance', adminAuth, adminController.createWhatsAppInstanceForUser);

// @route   DELETE /api/admin/whatsapp/delete-instance
// @desc    Manually delete WhatsApp instance for a user
// @access  Private (Admin only)
router.delete('/whatsapp/delete-instance', adminAuth, adminController.deleteWhatsAppInstanceForUser);

module.exports = router; 