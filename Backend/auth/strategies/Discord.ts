import { Strategy as DiscordStrategy } from 'passport-discord';
import Passport from 'passport';
import { CallbackError } from 'mongoose';
import { UserModel } from '../../database/models/UserModel';

export interface IExtendedProfile extends DiscordStrategy.Profile {
    accessToken: string;
    // eslint-disable-next-line camelcase
    premium_type: string|number;
    verifiedEmail: string;
}

module.exports.DiscordAuth = (passport: Passport.Authenticator) => {
    passport.use(
        new DiscordStrategy(
            // @ts-expect-error Options not following type
            {
                clientID: process.env.DISCORD_CLIENT_ID as string,
                clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
                callbackURL: `${process.env.FRONTEND_HOST}/discordredirect`,
                scope: ['identify', 'connections'],
                state: false,
            },
            // eslint-disable-next-line max-len
            // Above type error is caused by using IExtendedProfile, since the default typing doesn't have accessToken and premium_type properties.
            (async (_, __, profile: IExtendedProfile, done) => {
                const docu = new UserModel({
                    _id: profile.id,
                    username: profile.username,
                    mfa_enabled:
                        String(profile.mfa_enabled).toLowerCase() === 'true',
                    premium_type: parseInt(profile.premium_type as string, 10),
                    verifiedEmail:
                        String(profile.verified).toLowerCase() === 'true',
                    verified: false,
                    accessToken: profile.accessToken,
                    avatar: profile.avatar,
                    connection: [],
                });

                UserModel.findByIdAndUpdate(
                    profile.id,
                    docu,
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        useFindAndModify: true,
                    },
                    (err: CallbackError) => {
                        console.log(err);
                    },
                );
                return done(null, profile);
            }),
        ),
    );
};
