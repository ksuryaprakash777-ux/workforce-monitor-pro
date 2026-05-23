const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();


// REGISTER
router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        // DEMO ADMIN LOGIN
        if (
            email === 'admin@nexacorp.io' &&
            password === 'admin123'
        ) {

            return res.json({
                token: 'demo-token',
                user: {
                    id: '1',
                    name: 'Admin User',
                    email: 'admin@nexacorp.io',
                    role: 'admin'
                }
            });
        }

        return res.status(401).json({
            message: 'Invalid Credentials'
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Server Error'
        });
    }
});


// LOGIN
router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid Credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid Credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      token,
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: 'Server Error'
    });
  }
});

module.exports = router;