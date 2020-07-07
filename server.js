const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

//  Middeware
app.use(express.json({ extended: false }));

//  DB Setup
const connectDB = require('./config/db');
connectDB();

//  Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
