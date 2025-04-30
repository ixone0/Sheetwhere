const app = require('./app');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const connectToDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

connectToDatabase();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});