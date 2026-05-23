const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const employeeRoutes = require('./routes/employees');


require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());


// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);


// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Connected');
})
.catch((err) => {
  console.log(err);
});


// TEST ROUTE
app.get('/', (req, res) => {
  res.send('Backend Running Successfully');
});


// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});