const prisma = require('@prisma/client').PrismaClient;
const bcrypt = require('bcrypt');

const prismaClient = new prisma();

const registerUser = async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    console.log('Registering user:', email, password, confirmPassword);
    // Validate email domain
    if (!email.endsWith('@dome.tu.ac.th')) {
        return res.status(400).json({ error: 'Email must use @dome.tu.ac.th domain.' });
    }

    // Validate password match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Extract name from email
        const name = email.split('@')[0];

        // Create user in the database
        const newUser = await prismaClient.user.create({
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
        const user = await prismaClient.user.findFirst({
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
      const user = await prismaClient.user.findUnique({
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
        const user = await prismaClient.user.update({
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
    const { userId } = req.params;
  
    try {
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: { savedPosts: true },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      res.status(200).json(user.savedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      res.status(500).json({ error: 'Error fetching saved posts.' });
    }
};
const getUserPosts = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const posts = await prisma.post.findMany({
        where: { authorId: userId },
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
  
module.exports = { 
    registerUser, 
    getUserById,
    loginUser,
    savePost,
    getSavedPosts,
    getUserPosts,
    getUserSavedPosts,
};