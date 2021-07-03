const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    _id: String,
    type: String,
    createdAt: Date
});

const userSchema = new mongoose.Schema({
    _id: String, // the discord id
    username: String,
    mfa_enabled: Boolean,
    premium_type: {type: Number, min: 0, max: 3},
    verifiedEmail: Boolean,
    accessToken: String,
    avatar: String,
    verified: Boolean,
    connections: [connectionSchema],
    is_alt: Boolean,
    alt_ids: [String]
});

module.exports = {
    UserModel: mongoose.model('User', userSchema),
    ConnectionModel: mongoose.model('Connection', connectionSchema),
};
