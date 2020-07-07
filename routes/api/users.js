const express = require('express');
const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  Middleware
const auth = require('../../middleware/auth');

//  Modals
const User = require('../../models/User');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');

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
            //  Check if user does not exist
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

//  PRIVATE GET api/users/notifications :: GET USER NOTIFICATIONS
router.get('/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ date: -1 });
        const userNotifications = [];
        notifications.map((notification) => {
            notification.receivers.map(
                (user) =>
                    user == req.user.id && userNotifications.push(notification)
            );
        });
        res.json(userNotifications);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE GET api/user/likes :: GET USER LIKES
router.get('/likes', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        const userLikes = [];
        posts.map((post) => {
            post.likes.map(
                (like) =>
                    like.user.toString() == req.user.id && userLikes.push(post)
            );
        });
        res.json(userLikes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE GET api/users/posts :: GET USER POSTS
router.get('/posts', auth, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

module.exports = router;
