const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const registerUser = async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    console.log('Registering user:', email, password, confirmPassword);
    // Validate email domain
    if (!email.endsWith('@dome.tu.ac.th')) {
        return res.status(400).json({ error: 'Email must use @dome.tu.ac.th domain.' });
    }

    // Validateฆ password match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Extract name from email
        const name = email.split('@')[0];

        // Create user in the database
        const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
        });

        res.status(201).json({ message: 'User registered successfully.', user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user.', details: error.message });
    }
};

const loginUser = async (req, res) => {
    const { emailOrName, password } = req.body;

    try {
        // Find user by email or name
        const user = await prisma.user.findFirst({
        where: {
            OR: [
            { email: emailOrName },
            { name: emailOrName },
            ],
        },
        });

        if (!user) {
        return res.status(404).json({ error: 'User not found.' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password.' });
        }

        res.status(200).json({ message: 'Login successful.', user });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in.', details: error.message });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    console.log('Fetching user with ID:', id); // Debugging line
  
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
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
            connect: { id: postId },
            },
        },
        });

        res.status(200).json({ message: 'Post saved successfully.', user });
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Error saving post.' });
    }
};

const getSavedPosts = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        savedPosts: {
          include: {
            tags: true, // ดึงข้อมูล tags ของโพสต์ที่ถูกบันทึก
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.savedPosts);
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserPosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        tags: true, // รวมแท็กที่เกี่ยวข้อง
      },
    });
    res.status(200).json(posts);
  } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ error: 'Error fetching user posts.' });
    }
};
  
const getUserSavedPosts = async (req, res) => {
  const { userId } = req.params;
  
    try {
      const savedPosts = await prisma.user.findUnique({
        where: { id: userId },
        include: { savedPosts: true },
      });
  
      if (!savedPosts) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      res.status(200).json(savedPosts.savedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      res.status(500).json({ error: 'Error fetching saved posts.' });
    }
};

const uploadProfileImage = async (req, res) => {
  const { id } = req.params;

  try {
    // ดึงผู้ใช้ปัจจุบัน
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // ลบรูปโปรไฟล์เก่า (ถ้ามี)
    if (user.image) {
      const oldImagePath = path.join(__dirname, '../uploads', path.basename(user.image));
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error(`Error deleting old profile image: ${oldImagePath}`, err);
        }
      });
    }

    // อัปเดตรูปโปรไฟล์ใหม่
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { image: imageUrl },
    });

    res.status(200).json({ message: 'Profile image updated successfully.', imageUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Error uploading profile image.' });
  }
};

const deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    // ดึงข้อมูลผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: true, // ดึงโพสต์ทั้งหมดของผู้ใช้
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // ลบรูปโปรไฟล์ (ถ้ามี)
    if (user.image) {
      const filePath = path.join(__dirname, '../uploads', path.basename(user.image));
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting profile image: ${filePath}`, err);
        }
      });
    }

    // ลบรูปภาพที่เกี่ยวข้องกับโพสต์ของผู้ใช้
    user.posts.forEach((post) => {
      post.fileUrls.forEach((fileUrl) => {
        const filePath = path.join(__dirname, '../uploads', path.basename(fileUrl));
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting post image: ${filePath}`, err);
          }
        });
      });
    });

    // ลบโพสต์ทั้งหมดของผู้ใช้
    await prisma.post.deleteMany({
      where: { authorId: id },
    });

    // ลบผู้ใช้ในฐานข้อมูล
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Account and associated posts deleted successfully.' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Error deleting account.' });
  }
};

const getUserStats = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        likeCount: true, // ดึงเฉพาะจำนวนไลค์
      },
    });

    const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0); // รวมจำนวนไลค์ทั้งหมด

    res.status(200).json({
      posts: posts.length, // จำนวนโพสต์ทั้งหมด
      likes: totalLikes,   // จำนวนไลค์ทั้งหมด
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Error fetching user stats.' });
  }
};
  
module.exports = { 
    registerUser, 
    getUserById,
    loginUser,
    savePost,
    getSavedPosts,
    getUserPosts,
    getUserSavedPosts,
    uploadProfileImage,
    deleteAccount,
    getUserStats,
};