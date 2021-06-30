const RedditWrapper = require('snoowrap');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const { ApiClient } = require('twitch');
const TwitterWrapper = require('twitter');
const { google } = require('googleapis');
const moment = require('moment');
const axios = require('axios');
const { logger } = require('../../logger');

module.exports.checkIfAccountExists = async (accounts) => {
    let dupFound = false;
    logger.info(`Length of accounts map: ${accounts.size}`);
    if (accounts.size === 0) {
        logger.info('returning');
        return false;
    }
    accounts.foreach((key, value) => {
        logger.info(`${key} : ${value}`);
    });
    logger.info('NOT DONE');
    accounts.foreach(async (accountID, keyAccountType) => {
        logger.info('Inside foreach in checkIfAccountExists!');
        const accountDoc = SocialMediaAccountsModel({
            account_type: keyAccountType,
            account_ID: accountID,
            discord_ID: req.user.id,
        });

        const account = await SocialMediaAccountsModel.where({
            account_type: keyAccountType,
            account_ID: accountID,
        }).findOne().exec();

        if (account) {
            if (account.discord_ID !== req.user.id) {
                dupFound = true;
            }
        }
    });
    logger.info('DONE');
    return dupFound;
};

/**
 * Takes a req.user and then returns a map containing supported accounts
 * and ids
 *
 * @author omneex
 * @param sessionUser
 * @return {Promise<Map<any, any>>}
 * @see Request
 */
module.exports.getUserConnectionIDs = async (sessionUser) => {
    const resp = await axios.get(
        'https://discord.com/api/users/@me/connections',
        {
            headers: {
                Authorization: `Bearer ${sessionUser.accessToken}`,
            },
        },
    );

    const accounts = new Map();
    const supportedAccountTypes = ['youtube', 'twitter', 'twitch', 'reddit'];
    resp.data.forEach((el) => {
        if (
            supportedAccountTypes.indexOf(el.type) !== -1
            && el.verified === true
        ) {
            accounts.set(el.type, el.id);
        }
    });
    return accounts;
};

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
module.exports.getAccountAges = async (accounts) => {
    // YouTube
    let youtubePromise = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('youtube')) {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        });

        youtubePromise = youtube.channels.list({
            part: 'snippet',
            id: accounts.get('youtube'),
        });
    }

    // Twitter
    let twitterPromise = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('twitter')) {
        const client = new TwitterWrapper({
            consumer_key: process.env.TWITTER_CLIENT_ID,
            consumer_secret: process.env.TWITTER_CLIENT_SECRET,
            bearer_token: process.env.TWITTER_CLIENT_BEARER,
        });
        twitterPromise = client.get('users/show', {
            user_id: accounts.get('twitter'),
        });
    }

    // Twitch
    let twitchPromise = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('twitch')) {
        const authProvider = new ClientCredentialsAuthProvider(
            process.env.TWITCH_CLIENT_ID,
            process.env.TWITCH_CLIENT_SECRET,
        );
        const twitchClient = new ApiClient({ authProvider });
        twitchPromise = twitchClient.helix.users.getUserById('62730467');
    }

    // Reddit
    let redditPromise = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('reddit')) {
        const redditWrapper = new RedditWrapper({
            userAgent: 'OpenAD (v1)',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            refreshToken: process.env.REDDIT_REFRESH_TOKEN,
        });

        redditPromise = await redditWrapper
            .getUser(accounts.get('reddit'))
            .fetch();
    }
    // Wait for them all to finish!
    const [twitterUser, twitchUser, redditUser, youtubeUser] = await Promise.all([
        twitterPromise,
        twitchPromise,
        redditPromise,
        youtubePromise,
    ]);

    const accountsCreationDates = [];

    if (twitterUser !== null) {
        accountsCreationDates.push({
            type: 'twitter',
            id: accounts.get('twitter'),
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
            id: accounts.get('twitch'),
            creation_date: twitchUser.creationDate,
        });
    }
    if (redditUser !== null) {
        accountsCreationDates.push({
            type: 'reddit',
            id: accounts.get('reddit'),
            creation_date: new Date(redditUser.created_utc * 1000),
        });
    }
    if (youtubeUser !== null) {
        accountsCreationDates.push({
            type: 'youtube',
            id: accounts.get('youtube'),
            creation_date: new Date(
                youtubeUser.data.items[0].snippet.publishedAt,
            ),
        });
    }

    return accountsCreationDates;
};

/**
 * The verification algorithm
 *
 * @param accounts List of accounts and creation dates
 * @param serverID ID of the server being verified in
 * @param user the user object
 * @return {Promise<boolean>}
 * @see UserModel
 */
module.exports.verifyUser = async (accounts, _, user) => {
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
        score += user.premium_type * 11;
    }
    return score >= minscore;
};
