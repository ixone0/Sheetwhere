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

module.exports = {
  getTags,
};