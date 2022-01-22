const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'Jagveergagaan';

//Create a User using:- POST "/api/auth/createuser". No Login required.
router.post(
  '/createuser',
  [
    body('name', 'Enter a Valid Name').isLength({ min: 3 }),
    body('email', 'Enter a valid Email').isEmail(),
    body('password', 'Enter a valid Password').isLength({ min: 5 }),
  ],
  async (req, res) => {
    //if there are errors, return bad request and errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Check wheather user with this email exists already

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: 'Sorry A user with this E-mail already exists' });
      }

      const salt = await bcrypt.genSalt();
      const secPass = await bcrypt.hash(req.body.password, salt);

      //create new user
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.json({ authToken });
      //account created message with name of user
      // res.json(
      //   `{ "Message": "${user.name} Your Account has been created Successfully" }`
      // );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error Occured');
    }
  }
);

//Create a User using:- POST "/api/auth/Login". No Login required.
router.post(
  '/login',
  [
    body('email', 'Enter a valid Email').isEmail(),
    body('password', 'password cannot be blank').exists(),
  ],
  async (req, res) => {
    //if there is no valid email
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user === false) {
        return res
          .status(400)
          .jason({ error: 'Please try to login with correct Credentials' });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (passwordCompare === false) {
        return res
          .status(400)
          .json({ error: 'Please try to Login with correct Credentials' });
      }

      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.json({ authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error Occured');
    }
  }
);

module.exports = router;
