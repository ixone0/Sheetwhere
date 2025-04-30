const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const homeRoutes = require('./routes/homeRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/home', homeRoutes);
app.use('/api/user', userRoutes);

module.exports = app;