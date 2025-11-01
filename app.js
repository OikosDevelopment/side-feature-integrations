// app.js - Basic Express Server Setup

const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Hello from your AI productivity notes app backend!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
