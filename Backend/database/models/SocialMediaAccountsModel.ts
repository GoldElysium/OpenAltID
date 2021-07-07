import mongoose from 'mongoose';

/* eslint-disable camelcase */
interface ISocialMediaAccount {
    account_type: string;
    account_ID: string;
    discord_ID: string;
}
/* eslint-enable */

const SocialMediaAccountsSchema = new mongoose.Schema({
    account_type: String,
    account_ID: String,
    discord_ID: String,
});

// eslint-disable-next-line import/prefer-default-export
export const SocialMediaAccountsModel = mongoose.model<ISocialMediaAccount>('SocialMediaAccounts', SocialMediaAccountsSchema);
