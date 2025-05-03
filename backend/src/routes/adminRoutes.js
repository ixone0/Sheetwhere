const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middlewares/authMiddleware');

// ใช้ Middleware isAdmin
router.get('/reported-posts', isAdmin, adminController.getReportedPosts);
router.post('/delete-post', isAdmin, adminController.deletePost);
router.post('/reject-report', isAdmin, adminController.rejectReport);

module.exports = router;