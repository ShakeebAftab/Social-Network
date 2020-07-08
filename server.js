const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

//  Middeware
app.use(express.json({ extended: false }));

//  DB Setup
const connectDB = require('./config/db');
connectDB();

//  Swagger Setup
const swaggerUI = require('swagger-ui-express');
const swaggerDocs = require('./Swagger/swagger');
app.use('/api/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//  Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
