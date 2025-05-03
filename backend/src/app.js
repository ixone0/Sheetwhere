const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());

const homeRoutes = require('./routes/homeRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/home', homeRoutes);
app.use('/api/user', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

module.exports = app;