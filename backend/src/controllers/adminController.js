const prisma = require('../prismaClient');

// ดึงข้อมูลโพสต์ที่ถูกรายงาน
const getReportedPosts = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        post: {
          select: {
            id: true,
            title: true,
            fileUrls: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reported posts:', error);
    res.status(500).json({ error: 'Error fetching reported posts.' });
  }
};

// ลบโพสต์ (Approve)
const deletePost = async (req, res) => {
  const { postId } = req.body;

  try {
    await prisma.post.delete({
      where: { id: postId },
    });

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post.' });
  }
};

// ปฏิเสธการรายงาน (Reject)
const rejectReport = async (req, res) => {
  const { reportId } = req.body;

  try {
    await prisma.report.delete({
      where: { id: reportId },
    });

    res.status(200).json({ message: 'Report rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(500).json({ error: 'Error rejecting report.' });
  }
};

module.exports = {
  getReportedPosts,
  deletePost,
  rejectReport,
};