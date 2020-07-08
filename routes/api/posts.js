const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

//  Middleware
const auth = require('../../middleware/auth');

//  Modals
const User = require('../../models/User');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');

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
            : res.status(404).json({ msg: 'Post not found!' });
    } catch (error) {
        console.error(error.message);
        error.kind == 'ObjectId'
            ? res.status.json({ msg: 'Post not found!' })
            : res.status(500).send(`Server Error`);
    }
});

//  PRIVATE DELETE api/users/:postId :: DELETE A POST
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found!' });
        }
        post.user.toString() != req.user.id
            ? res.status(400).json({ msg: 'Access denied' })
            : await post.remove(),
            res.json({ msg: 'Post Removed' });
    } catch (error) {
        console.error(error.message);
        error.kind == 'ObjectId'
            ? res.status(404).json({ msg: 'Post not found!' })
            : res.status(500).send(`Server Error`);
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
            const [user, post] = await Promise.all([
                User.findById(req.user.id).select('-password'),
                Post.findById(req.params.postId),
            ]);
            const newComment = {
                user: req.user.id,
                name: user.name,
                body: req.body.body,
            };
            const gatherReceivers = [post.user.toString()];
            post.comments.map(
                (comment) =>
                    comment.user.toString() != req.user.id &&
                    gatherReceivers.push(comment.user.toString())
            );
            const receivers = [...new Set(gatherReceivers)];
            const newNotification = new Notification({
                post: req.params.postId,
                postName: post.name,
                name: user.name,
                type: true,
                receivers,
            });
            post.comments.unshift(newComment);
            await Promise.all([newNotification.save(), post.save()]);
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
        if (!post) {
            return res.status(404).json({ msg: 'Post not found!' });
        }
        let isMatch = false;
        let commentIndex;
        post.comments.map((comment, index) => {
            if (
                comment.user.toString() == req.user.id &&
                comment.id == req.params.commentId
            ) {
                isMatch = true;
                commentIndex = index;
            }
        });
        if (!isMatch) {
            return res.status(400).json({ msg: 'Access Denied' });
        }
        post.comments.splice(commentIndex, 1);
        await post.save();
        res.json(post.comments);
    } catch (error) {
        console.log(error.message);
        error.kind == 'ObjectId'
            ? res.status(404).json({ msg: 'Post not found!' })
            : res.status(500).send(`Server Error`);
    }
});

//  PRIVATE PUT api/posts/likes/:postId :: LIKE A POST
router.put('/likes/:postId', auth, async (req, res) => {
    try {
        const [post, user] = await Promise.all([
            Post.findById(req.params.postId),
            User.findById(req.user.id).select('-password'),
        ]);
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

        const gatherReceivers = [post.user.toString()];
        post.likes.map(
            (like) =>
                like.user.toString() != req.user.id &&
                gatherReceivers.push(like.user.toString())
        );
        const receivers = [...new Set(gatherReceivers)];
        const newNotification = new Notification({
            post: req.params.postId,
            postName: post.name,
            name: user.name,
            type: false,
            receivers,
        });
        post.likes.unshift(newLike);
        await Promise.all([newNotification.save(), post.save()]);
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
        error.kind == 'ObjectId'
            ? res.status(404).json({ msg: 'Post not found!' })
            : res.status(500).send(`Server Error`);
    }
});

//  PRIVATE PATCH api/posts/:postId :: EDIT A POST
router.patch(
    '/:postId',
    [auth, [check('body', 'Post body is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        try {
            const post = await Post.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ msg: 'Post not found!' });
            }
            if (post.user.toString() != req.user.id) {
                return res.status(400).json({ msg: 'Access Denied' });
            }
            post.body = req.body.body;
            await post.save();
            res.json(post);
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

//  PRIVATE PATCH api/posts/comments/:postId/:commentId :: EDIT A COMMENT
router.patch(
    '/comments/:postId/:commentId',
    [auth, [check('body', 'Comment body is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ error: errors.array() });
        }
        try {
            const post = await Post.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ msg: 'Post not found!' });
            }
            let isMatch = false;
            let commentIndex;
            post.comments.map((comment, index) => {
                if (
                    comment.user.toString() == req.user.id &&
                    comment.id == req.params.commentId
                ) {
                    isMatch = true;
                    commentIndex = index;
                }
            });
            if (!isMatch) {
                return res.status(400).json({ msg: 'Access Denied' });
            }
            post.comments[commentIndex].body = req.body.body;
            await post.save();
            res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Server Error`);
        }
    }
);

module.exports = router;
