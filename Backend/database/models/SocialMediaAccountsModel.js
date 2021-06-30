let mongoose = require('mongoose');

let SocialMediaAccountsSchema = new mongoose.Schema({
    account_type: String,
    account_ID: String,
    discord_ID: String

});

module.exports = {
    SocialMediaAccountsModel: mongoose.model('SocialMediaAccounts', SocialMediaAccountsSchema),

};
