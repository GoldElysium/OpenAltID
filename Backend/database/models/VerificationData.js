let mongoose = require('mongoose');



let verificationSchema = new mongoose.Schema({
    verification_ID: String,
    guild_ID: Number,
    user_ID: Number,
});

module.exports = {
    verificationModel: mongoose.model('Verification', verificationSchema),

};
