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

module.exports = { 
    registerUser,
    loginUser,
};