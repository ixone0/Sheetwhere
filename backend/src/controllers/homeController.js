// src/controllers/homeController.js
const prisma = require('../prismaClient');

const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany();
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getPosts = async (req, res) => {
  const { search, tag } = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
                ],
              }
            : {},
          tag ? { tags: { some: { name: tag } } } : {},
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

module.exports = {
  getTags,
  getPosts,
};