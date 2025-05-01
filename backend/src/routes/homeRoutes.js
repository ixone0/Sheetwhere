const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/tags', homeController.getTags);
router.get('/posts', homeController.getPosts);

module.exports = router;