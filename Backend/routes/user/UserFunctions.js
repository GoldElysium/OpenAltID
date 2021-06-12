const RedditWrapper = require('snoowrap');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const { ApiClient } = require('twitch');
const TwitterWrapper = require('twitter');
const { google } = require('googleapis');
const moment = require('moment');
const axios = require('axios');

/**
 * Takes a req.user and then returns a map containing supported accounts
 * and ids
 *
 * @author omneex
 * @param sessionUser
 * @return {Promise<Map<any, any>>}
 * @see Request
 */
module.exports.getUserConnectionIDs = async function getUserConnectionIDs(
    sessionUser
) {
    let resp = await axios.get(
        'https://discord.com/api/users/@me/connections',
        {
            headers: {
                Authorization: 'Bearer ' + sessionUser.accessToken,
            },
        }
    );

    let accounts = new Map();
    const supportedAccountTypes = ['youtube', 'twitter', 'twitch', 'reddit'];
    resp.data.forEach((el) => {
        if (
            supportedAccountTypes.indexOf(el.type) !== -1 &&
            el.verified === true
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
module.exports.getAccountAges = async function getAccountAges(accounts) {
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
        var client = new TwitterWrapper({
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
        let authProvider = new ClientCredentialsAuthProvider(
            process.env.TWITCH_CLIENT_ID,
            process.env.TWITCH_CLIENT_SECRET
        );
        let twitchClient = new ApiClient({ authProvider });
        twitchPromise = twitchClient.helix.users.getUserById('62730467');
    }

    // Reddit
    let redditPromise = new Promise((resolve) => {
        resolve(null);
    });
    if (accounts.has('reddit')) {
        const redditWrapper = new RedditWrapper({
            userAgent: 'OpenAD (v1)',
            clientId: process.env['REDDIT_CLIENT_ID'],
            clientSecret: process.env['REDDIT_CLIENT_SECRET'],
            refreshToken: process.env['REDDIT_REFRESH_TOKEN'],
        });

        redditPromise = await redditWrapper
            .getUser(accounts.get('reddit'))
            .fetch();
    }
    let twitterUser, twitchUser, redditUser, youtubeUser;
    // Wait for them all to finish!
    [twitterUser, twitchUser, redditUser, youtubeUser] = await Promise.all([
        twitterPromise,
        twitchPromise,
        redditPromise,
        youtubePromise,
    ]);

    let accountsCreationDates = [];

    if (twitterUser !== null) {
        accountsCreationDates.push({
            type: 'twitter',
            id: accounts.get('twitter'),
            creation_date: moment(
                twitterUser.created_at,
                'dd MMM DD HH:mm:ss ZZ YYYY',
                'en'
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
                youtubeUser.data.items[0].snippet.publishedAt
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
module.exports.verifyUser = async function verifyUser(
    accounts,
    serverID,
    user
) {
    // Todo get the min days and min score from the database
    let score = 0;
    let zeroPoint = 180;

    // Todo get number of accounts from database
    let preferredNumOfAccounts = 2;
    let difficultyMultiplier = 25;
    let minscore = zeroPoint * preferredNumOfAccounts + difficultyMultiplier;

    let dtMin = new Date(Date.now()).getTime();

    accounts.forEach((account) => {
        let dtAccount = account.creation_date.getTime();

        let diff = (dtMin - dtAccount) / (60 * 60 * 24 * 1000);
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
