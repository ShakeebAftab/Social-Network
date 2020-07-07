const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  Middleware
const auth = require('../../middleware/auth');

//  Modals
const User = require('../../modals/User');
const Post = require('../../modals/Post');
const { compareSync } = require('bcryptjs');

//  PRIVATE GET api/posts :: GET ALL POSTS
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
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
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

//  PRIVATE GET api/posts/:postId :: GET SINGLE POST
router.get('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        post
            ? res.json({ post })
            : res.status(404).json({ msg: 'Post was not found' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE DELETE api/users/:postId :: DELETE A POST
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        post.user.toString() != req.user.id
            ? res.status(400).json({ msg: 'Access denied' })
            : await post.remove(),
            res.json({ msg: 'Post Removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE PUT api/posts/comments/:postId :: CREATE A NEW COMMENT
router.put(
    '/comments/:postId',
    [auth, [check('body', 'Comment body is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id);
            const post = await Post.findById(req.params.postId);
            const newComment = {
                user: req.user.id,
                name: user.name,
                body: req.body.body,
            };
            post.comments.unshift(newComment);
            await post.save();
            res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

//  PRIVATE DELETE api/posts/comments/:postId/:commentId :: DELETE A COMMENT
router.delete('/comments/:postId/:commentId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        let isMatch = false;
        post.comments.map((comment) => {
            if (comment.user.toString() == req.user.id) {
                isMatch = true;
            }
        });
        if (!isMatch) {
            return res.status(400).json({ msg: 'Access Denied' });
        }
        const updatedComments = [];
        post.comments.map((comment) => {
            comment.id != req.params.commentId && updatedComments.push(comment);
        });
        post.comments = updatedComments;
        await post.save();
        res.json(post.comments);
    } catch (error) {
        console.log(error.message);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE PUT api/posts/like/:postId :: LIKE A POST
router.put('/likes/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            res.status(400).json({ msg: 'Post not found!' });
        }
        if (
            post.likes.filter((like) => like.user.toString() == req.user.id)
                .length > 0
        ) {
            return res.status(400).json({ msg: 'Post already liked' });
        }
        const newLike = {
            user: req.user.id,
        };
        post.likes.unshift(newLike);
        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error);
        res.status(500).send(`Server Error`);
    }
});

//  PRIVATE DELETE api/posts/unlike/:postId ::UNLIKE A POST
router.delete('/unlike/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json('Post not found!');
        }
        if (
            post.likes.filter((like) => like.user.toString() == req.user.id)
                .length == 0
        ) {
            return res.status(400).json({ msg: 'Post was never liked' });
        }

        const updatedLikes = [];
        post.likes.map((like) => {
            like.user.toString() != req.user.id && updatedLikes.push(like);
        });

        post.likes = updatedLikes;
        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error`);
    }
});

module.exports = router;
