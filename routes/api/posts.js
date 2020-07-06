const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  Middleware
const auth = require('../../middleware/auth');

//  Modals
const User = require('../../modals/User');
const Post = require('../../modals/Post');

//  PRIVATE GET api/posts :: GET ALL POSTS
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.log(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE POST api/posts :: CREATE NEW POST
router.post(
    '/',
    [auth, [check('body', 'Post Body is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const newPost = new Post({
                user: req.user.id,
                name: user.name,
                body: req.body.body,
            });
            await newPost.save();
            res.json(newPost);
        } catch (error) {
            console.log(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

module.exports = router;
