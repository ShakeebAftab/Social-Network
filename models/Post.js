const { Schema, model } = require('mongoose');

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
    },
    name: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users',
            },
            name: {
                type: String,
                required: true,
            },
            body: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users',
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Post = model('post', PostSchema);
