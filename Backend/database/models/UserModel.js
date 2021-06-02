const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
    _id: Number, // the discord id
    username: String,
    mfa_enabled: Boolean,
    premium_type: {type: Number, min: 0, max: 3},
    verified: Boolean,
    accessToken: String,
    avatar: String,
    connections: [connection]
});

module.exports.UserModel = mongoose.model("User", userSchema);