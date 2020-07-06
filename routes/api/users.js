const express = require('express');
const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  Modals
const User = require('../../modals/User');

//  PUBLIC POST api/user/signup :: ADD NEW USER
router.post(
    '/signup',
    [
        check('firstName', 'First Name is required').not().isEmpty(),
        check('lastName', 'Last Name is required').not().isEmpty(),
        check('email', 'Valid email must be used').normalizeEmail().isEmail(),
        check('password', 'Password is required').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        const { firstName, lastName, email, password } = req.body;
        try {
            //  Check if user already exists
            const user = await User.findOne({ email });
            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
            }

            //  Password Hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(password, salt);

            const userFields = {
                name: `${firstName} ${lastName}`,
                email,
                password: hashedPass,
            };

            const newUser = new User(userFields);
            await newUser.save();

            //  Handling JWT Token
            const payload = {
                user: {
                    id: newUser.id,
                },
            };

            jwt.sign(
                payload,
                config.get('jwtTokenSecret'),
                { expiresIn: 31536000 },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({ token });
                }
            );
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

//  PUBLIC POST api/users/signin :: LOGIN USER
router.post(
    '/signin',
    [
        check('email', 'Valid email must be used').normalizeEmail().isEmail(),
        check('password', 'Password is required').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        const { email, password } = req.body;
        try {
            //  Check if user already exists
            const user = await User.findOne({ email });
            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User dose not exist' }] });
            }

            //  Check Password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Password' }] });
            }

            //  Handling JWT Token
            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                config.get('jwtTokenSecret'),
                { expiresIn: 31536000 },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({ token });
                }
            );
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

module.exports = router;
