let mongoose = require('mongoose');

let connectionSchema = new mongoose.Schema({
    _id: String,
    type: String,
    createdAt: Date,
});

let userSchema = new mongoose.Schema({
    _id: String, // the discord id
    username: String,
    mfa_enabled: Boolean,
    premium_type: { type: Number, min: 0, max: 3 },
    verifiedEmail: Boolean,
    accessToken: String,
    avatar: String,
    verified: Boolean,
    connections: [connectionSchema],
});

module.exports = {
    UserModel: mongoose.model('User', userSchema),
    ConnectionModel: mongoose.model('Connection', connectionSchema),
};
