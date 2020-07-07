const { Schema, model } = require('mongoose');

const NotificationSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'posts',
    },
    postName: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    receivers: [],
    type: {
        // "true" for comment and "false" for like
        type: Boolean,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Notification = model('notification', NotificationSchema);
