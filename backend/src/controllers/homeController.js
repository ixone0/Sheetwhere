// src/controllers/homeController.js
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// กำหนดที่จัดเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // ชี้ไปที่ backend/src/uploads
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const sanitizedFilename = file.originalname
      .replace(extension, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}${extension}`);
  },
});

// ฟิลเตอร์เฉพาะไฟล์รูปภาพ
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png).'), false);
  }
};

// Endpoint สำหรับอัปโหลดหลายไฟล์
const uploadImages = async (req, res) => {
  try {
    console.log('Files:', req.files); // ตรวจสอบไฟล์ที่อัปโหลด
    const fileUrls = req.files.map((file) => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });
    res.status(200).json({ fileUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Error uploading images.' });
  }
};

const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany();
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getPosts = async (req, res) => {
  const { search, tags } = req.query;
  try {
    // แปลง tags string เป็น array (ถ้ามี)
    const tagArray = tags ? tags.split(',').filter(Boolean) : [];

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          // เงื่อนไขการค้นหาด้วย search query
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
                ],
              }
            : {},
          // เงื่อนไขการกรองด้วย tags แบบ OR
          tagArray.length > 0
            ? {
                tags: {
                  some: {
                    name: {
                      in: tagArray // ใช้ in จะทำให้เป็นเงื่อนไข OR โดยอัตโนมัติ
                    }
                  }
                }
              }
            : {},
        ],
      },
      include: {
        tags: true,
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPost = async (req, res) => {
  const { title, tags, description, fileUrls, authorId } = req.body;

  try {
    const post = await prisma.post.create({
      data: {
        title,
        description,
        fileUrls: { set: fileUrls },
        authorId,
        tags: {
          connectOrCreate: tags.split(',').map((tag) => ({
            where: { name: tag.trim() },
            create: { name: tag.trim() },
          })),
        },
      },
    });
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post.' });
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true, // ดึงชื่อของผู้คอมเมนต์
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const savePost = async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        savedPosts: {
          connect: { id: postId }, // เชื่อมความสัมพันธ์กับโพสต์ที่ต้องการบันทึก
        },
      },
    });

    res.status(200).json({ message: 'Post saved successfully!', user });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Error saving post.' });
  }
};

const isPostSaved = async (req, res) => {
  const { userId, postId } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedPosts: {
          where: { id: postId },
        },
      },
    });

    const isSaved = user?.savedPosts.length > 0;
    res.status(200).json({ isSaved });
  } catch (error) {
    console.error('Error checking if post is saved:', error);
    res.status(500).json({ error: 'Error checking if post is saved.' });
  }
};

const unsavePost = async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        savedPosts: {
          disconnect: { id: postId }, // ยกเลิกความสัมพันธ์กับโพสต์ที่เซฟไว้
        },
      },
    });

    res.status(200).json({ message: 'Post unsaved successfully!', user });
  } catch (error) {
    console.error('Error unsaving post:', error);
    res.status(500).json({ error: 'Error unsaving post.' });
  }
};

// เพิ่มคอมเมนต์
const addComment = async (req, res) => {
  const { postId, userId, content } = req.body;

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment.' });
  }
};

// ลบคอมเมนต์
const deleteComment = async (req, res) => {
  const { commentId, userId } = req.body;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true, author: true },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // ตรวจสอบสิทธิ์การลบ (เจ้าของโพสต์, ผู้คอมเมนต์, หรือแอดมิน)
    const isOwner = comment.post.authorId === userId;
    const isCommenter = comment.authorId === userId;
    const isAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!isOwner && !isCommenter && !isAdmin?.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Error deleting comment.' });
  }
};

const reportPost = async (req, res) => {
  const { postId, userId, reason, details } = req.body;

  try {
    const report = await prisma.report.create({
      data: {
        postId,
        reporterId: userId,
        reason,
        details,
      },
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Error reporting post.' });
  }
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, description, fileUrls } = req.body;

  try {
    // ดึงโพสต์ปัจจุบันจากฐานข้อมูล
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // ตรวจสอบรูปภาพที่ถูกลบ
    const deletedImages = existingPost.fileUrls.filter((url) => !fileUrls.includes(url));

    // ลบไฟล์รูปภาพที่ถูกลบออกจาก fileUrls
    deletedImages.forEach((fileUrl) => {
      const filePath = path.join(__dirname, '../uploads', path.basename(fileUrl));
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${filePath}`, err);
        } else {
          console.log(`File deleted: ${filePath}`);
        }
      });
    });

    // อัปเดตโพสต์ในฐานข้อมูล
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        description,
        fileUrls: { set: fileUrls }, // อัปเดตรูปภาพใหม่
      },
    });

    res.status(200).json({ message: 'Post updated successfully.', post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Error updating post.' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // ตรวจสอบสิทธิ์การลบ (เจ้าของโพสต์หรือแอดมิน)
    const isOwner = post.authorId === userId;
    const isAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!isOwner && !isAdmin?.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this post.' });
    }

    // ลบไฟล์รูปภาพในโฟลเดอร์ uploads
    post.fileUrls.forEach((fileUrl) => {
      const filePath = path.join(__dirname, '../uploads', path.basename(fileUrl));
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${filePath}`, err);
        } else {
          console.log(`File deleted: ${filePath}`);
        }
      });
    });

    // ลบโพสต์ในฐานข้อมูล
    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Post and associated images deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post.' });
  }
};

module.exports = {
  getTags,
  getPosts,
  createPost,
  uploadImages,
  fileFilter,
  storage,
  getPostById,
  savePost,
  isPostSaved,
  unsavePost,
  addComment,
  deleteComment,
  reportPost,
  updatePost,
  deletePost,
};