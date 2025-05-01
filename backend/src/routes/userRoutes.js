const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile/:id', userController.getUserById);
router.post('/save-post', userController.savePost);
router.get('/saved/:userId', userController.getSavedPosts);
router.get('/posts/:userId', userController.getUserPosts);

module.exports = router;