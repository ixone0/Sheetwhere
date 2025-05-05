const express = require('express');
const userController = require('../controllers/userController');
const multer = require('multer');
const { storage, fileFilter } = require('../controllers/homeController'); // ใช้ storage และ fileFilter เดิม
const upload = multer({ storage, fileFilter });
const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile/:id', userController.getUserById);
router.post('/save-post', userController.savePost);
router.get('/saved/:userId', userController.getSavedPosts);
router.get('/posts/:userId', userController.getUserPosts);
router.get('/saved-posts/:id', userController.getSavedPosts);
router.post('/upload-profile-image/:id', upload.single('image'), userController.uploadProfileImage);
router.delete('/delete-account/:id', userController.deleteAccount);

module.exports = router;