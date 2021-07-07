import mongoose from 'mongoose';

interface IConnection {
    _id: string;
    type: string;
    createdAt: Date;
}

/* eslint-disable camelcase */
export interface IUser {
    _id: string;
    username: string;
    mfa_enabled: boolean;
    premium_type: number | string;
    verifiedEmail: boolean;
    accessToken: string;
    verified: boolean;
    connections: IConnection[];
    is_alt: boolean;
    alt_ids: string[];
}
/* eslint-enable */

const connectionSchema = new mongoose.Schema({
    _id: String,
    type: String,
    createdAt: Date,
});

const userSchema = new mongoose.Schema({
    _id: String, // the discord id
    username: String,
    mfa_enabled: Boolean,
    premium_type: { type: Number, min: 0, max: 3 },
    verifiedEmail: Boolean,
    accessToken: String,
    avatar: String,
    verified: Boolean,
    connections: [connectionSchema],
    is_alt: Boolean,
    alt_ids: [String],
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
export const ConnectionModel = mongoose.model<IConnection>('Connection', connectionSchema);
