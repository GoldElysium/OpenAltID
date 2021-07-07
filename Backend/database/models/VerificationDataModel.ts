import mongoose from 'mongoose';

/* eslint-disable camelcase */
interface IVerification {
    verification_ID: string;
    guild_ID: number;
    user_ID: number;
}
/* eslint-enable */

const verificationSchema = new mongoose.Schema({
    verification_ID: String,
    guild_ID: Number,
    user_ID: Number,
});

// eslint-disable-next-line import/prefer-default-export
export const VerificationModel = mongoose.model<IVerification>('Verification', verificationSchema);
