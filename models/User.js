const { Schema, model } = require('mongoose');
const {
    modelName,
} = require('../../../ReactProjects/SocialNetwork/modals/User');

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = User = model('user', UserSchema);
