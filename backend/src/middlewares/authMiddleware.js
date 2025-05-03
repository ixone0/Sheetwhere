const prisma = require('../prismaClient');

const isAdmin = async (req, res, next) => {
  const userId = req.body?.userId || req.query?.userId || req.headers['user-id']; // ดึง userId จาก body, query, หรือ headers
  console.log('User ID:', userId); // Debugging log
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { isAdmin };