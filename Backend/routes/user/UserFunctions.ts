import RedditWrapper, { RedditUser } from 'snoowrap';
import { ClientCredentialsAuthProvider } from 'twitch-auth';
import { ApiClient, HelixUser } from 'twitch';
import TwitterWrapper from 'twitter';
// eslint-disable-next-line camelcase
import { google, youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import moment from 'moment';
import axios from 'axios';
import express from 'express';
import { UserModel } from '../../database/models/UserModel';
import logger from '../../logger';
import { SocialMediaAccountsModel } from '../../database/models/SocialMediaAccountsModel';

async function checkAccounts(keyAccountType: string, accountID: string, req: express.Request) {
    logger.info('Inside foreach in checkIfAccountExists!');

    if (!req.user?.id) throw Error('No user in express session found!');

    // TODO: Handle errors
    const account = await SocialMediaAccountsModel.where({
        account_type: keyAccountType,
        account_ID: accountID,
    }).findOne().exec();

    if (account) {
        if (account.discord_ID !== req.user?.id) {
            // If alt is found, mark the new one as an alt and list it's ID down in the older one
            const newAccountSearch = UserModel.findById(req.user.id).exec();
            const oldAccountSearch = UserModel.findById(account.discord_ID).exec();

            // eslint-disable-next-line max-len
            const [oldAccount, newAccount] = await Promise.all([oldAccountSearch, newAccountSearch]);
            // TODO: Temp error, replace with a better message
            if (!oldAccount || !newAccount) throw new Error('Something went terribly wrong!');

            let prom1;
            if (!newAccount.is_alt) {
                newAccount.is_alt = true;
                prom1 = newAccount.save();
            } else {
                prom1 = new Promise((resolve) => {
                    resolve(null);
                });
            }
            oldAccount.alt_ids.push(req.user.id);
            const prom2 = oldAccount.save();
            await Promise.all([prom1, prom2]);
            return true;
        }
        return false;
    }
    const docu = new SocialMediaAccountsModel({
        account_type: keyAccountType,
        account_ID: accountID,
        discord_ID: req.user.id,
    });

    await docu.save();
    return false;
}

/* eslint-disable max-len */
/**
 * Takes a list of accounts and a request object and checks to see if the accounts have been seen before
 * @param req
 * @param accounts
 * @returns {Promise<boolean>}
 */
export async function checkIfAccountsExists(req: express.Request, accounts: Map<string, string>) {
    /* eslint-enable */
    if (accounts.size === 0) {
        return false;
    }
    accounts.forEach((key, value) => {
        logger.info(`${key} : ${value}`);
    });
    let results: boolean[] = [];
    accounts.forEach(async (accountID, keyAccountType) => {
        results.push(await checkAccounts(keyAccountType, accountID, req));
    });
    results = await Promise.all(results);

    return results.includes(true);
}

/* eslint-disable camelcase */
// Mostly typed after the Discord docs, just to be future proof all properties are added.
interface IConnection {
    id: string;
    name: string;
    type: string;
    revoked?: boolean;
    integrations?: object[];
    verified: boolean;
    friend_sync: boolean;
    show_activity: boolean;
    visiblity: 0 | 1;
}
/* eslint-enable */

/**
 * Takes a req.user and then returns a map containing supported accounts
 * and ids
 *
 * @author omneex
 * @param sessionUser
 * @return {Promise<Map<string, string>>}
 * @see Request
 */
export async function getUserConnectionIDs(sessionUser: Express.User) {
    const resp = await axios.get(
        'https://discord.com/api/users/@me/connections',
        {
            headers: {
                Authorization: `Bearer ${sessionUser.accessToken}`,
            },
        },
    );
    logger.info(resp.status);
    logger.info(resp.statusText);
    logger.info(JSON.stringify(resp.data, null, 4));

    logger.info('getting accounts');
    const accounts = new Map<string, string>();
    const supportedAccountTypes = ['youtube', 'twitter', 'twitch', 'reddit'];
    resp.data.forEach((el: IConnection) => {
        if (
            supportedAccountTypes.indexOf(el.type) !== -1
            && el.verified === true
        ) {
            // TODO: Could possibly be simplified to el.name ?? el.id, is a bit less obvious tho
            if (el.type === 'reddit') {
                // Reddit does not use the ID it uses the name
                accounts.set(el.type, el.name);
            } else {
                accounts.set(el.type, el.id);
            }
        }
    });
    logger.info('Got accounts');
    return accounts;
}

/* eslint-disable camelcase */
export interface IAccountAge {
    type: string;
    id: string;
    creation_date: Date;
}
/* eslint-enable */

/**
 * Makes API calls to the various different supported services and grabs the account creation date
 *
 * Each account type has a place holder promise that resolves to null, if the account is supplied
 * it then reassigns the promise to an actual promise.
 *
 * @author omneex
 * @param accounts A Map of accounts and ids
 * @return {Promise<[]>}
 * @see Map
 */
export async function getAccountAges(accounts: Map<string, string>): Promise<IAccountAge[]> {
    // YouTube
    // eslint-disable-next-line max-len,camelcase
    let youtubePromise: Promise<null>|Promise<GaxiosResponse<youtube_v3.Schema$ChannelListResponse>> = new Promise((resolve) => {
        resolve(null);
    }) as Promise<null>;
    if (accounts.has('youtube')) {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        });

        youtubePromise = youtube.channels.list({
            // TODO: Look into this
            // @ts-expect-error part is not part of the options
            part: 'snippet',
            id: accounts.get('youtube') as string,
            // eslint-disable-next-line camelcase
        }) as Promise<GaxiosResponse<youtube_v3.Schema$ChannelListResponse>>;
    }

    // Twitter
    let twitterPromise: Promise<null|TwitterWrapper.ResponseData> = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('twitter')) {
        const client = new TwitterWrapper({
            consumer_key: process.env.TWITTER_CLIENT_ID as string,
            consumer_secret: process.env.TWITTER_CLIENT_SECRET as string,
            bearer_token: process.env.TWITTER_CLIENT_BEARER as string,
        });
        twitterPromise = client.get('users/show', {
            user_id: accounts.get('twitter') as string,
        });
    }

    // Twitch
    let twitchPromise: Promise<null|HelixUser> = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('twitch')) {
        const authProvider = new ClientCredentialsAuthProvider(
            process.env.TWITCH_CLIENT_ID as string,
            process.env.TWITCH_CLIENT_SECRET as string,
        );
        const twitchClient = new ApiClient({ authProvider });
        twitchPromise = twitchClient.helix.users.getUserById(accounts.get('twitch') as string);
    }
    logger.debug(`REDDIT ACCOUNT NAME: ${accounts.get('reddit')}`);

    // Reddit
    let redditUser = null;
    if (accounts.has('reddit')) {
        logger.debug(`REDDIT ACCOUNT NAME: ${accounts.get('reddit')}`);
        const redditWrapper = new RedditWrapper({
            userAgent: 'OpenAD (v1)',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            refreshToken: process.env.REDDIT_REFRESH_TOKEN,
        });

        // Apparently already is synchronous: https://stackoverflow.com/questions/54735688/typescript-error-1062-type-is-referenced-directly-or-indirectly-in-the-fulfill
        redditUser = redditWrapper
            .getUser(accounts.get('reddit') as string)
            .fetch() as RedditUser;
    }

    // Wait for them all to finish!
    // eslint-disable-next-line max-len
    const [twitterUser, twitchUser, youtubeUser] = await Promise.all([
        twitterPromise,
        twitchPromise,
        youtubePromise,
    ]);

    const accountsCreationDates: IAccountAge[] = [];

    if (twitterUser !== null) {
        accountsCreationDates.push({
            type: 'twitter',
            id: accounts.get('twitter') as string,
            creation_date: moment(
                twitterUser.created_at,
                'dd MMM DD HH:mm:ss ZZ YYYY',
                'en',
            ).toDate(),
        });
    }
    if (twitchUser !== null) {
        accountsCreationDates.push({
            type: 'twitch',
            id: accounts.get('twitch') as string,
            creation_date: twitchUser.creationDate,
        });
    }
    if (redditUser !== null) {
        accountsCreationDates.push({
            type: 'reddit',
            id: accounts.get('reddit') as string,
            creation_date: new Date(redditUser.created_utc * 1000),
        });
    }
    if (youtubeUser !== null) {
        accountsCreationDates.push({
            type: 'youtube',
            id: accounts.get('youtube') as string,
            creation_date: new Date(
                // @ts-expect-error possibly undefined
                youtubeUser.data.items[0].snippet.publishedAt as string,
            ),
        });
    }

    return accountsCreationDates;
}

/**
 * The verification algorithm
 *
 * @param accounts List of accounts and creation dates
 * @param _ ID of the server being verified in
 * @param user the user object
 * @return {Promise<boolean>}
 * @see UserModel
 */
export async function verifyUser(accounts: IAccountAge[], _: string, user: Express.User) {
    // Todo get the min days and min score from the database
    let score = 0;
    const zeroPoint = 180;

    // Todo get number of accounts from database
    const preferredNumOfAccounts = 2;
    const difficultyMultiplier = 25;
    const minscore = zeroPoint * preferredNumOfAccounts + difficultyMultiplier;

    const dtMin = new Date(Date.now()).getTime();

    accounts.forEach((account) => {
        const dtAccount = account.creation_date.getTime();

        const diff = (dtMin - dtAccount) / (60 * 60 * 24 * 1000);
        score += (diff / zeroPoint) * 100;
    });

    // Todo Get the score to add from the database
    if (user.mfa_enabled) {
        score += 50;
    }

    // Todo Get the mulitplier from database
    if (user.premium_type) {
        score += user.premium_type as number * 11;
    }

    return {
        verified: score >= minscore,
        score,
        minscore,
    };
}
