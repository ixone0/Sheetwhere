const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const multer = require('multer');
const { storage, fileFilter } = require('../controllers/homeController');

const upload = multer({ storage, fileFilter });

router.get('/tags', homeController.getTags);
router.post('/posts', homeController.createPost);
router.put('/posts/:id', homeController.updatePost);
router.delete('/posts/:id', homeController.deletePost);
router.post('/upload-multiple', upload.array('images', 10), homeController.uploadImages);
router.get('/posts/:id', homeController.getPostById);
router.post('/save-post', homeController.savePost);
router.post('/posts/:id/comments', homeController.addComment);
router.delete('/comments', homeController.deleteComment);
router.get('/is-post-saved', homeController.isPostSaved);
router.post('/unsave-post', homeController.unsavePost);
router.post('/report-post', homeController.reportPost);
router.get('/posts', homeController.getPosts);
router.post('/posts/:id/like', homeController.toggleLike);

module.exports = router;