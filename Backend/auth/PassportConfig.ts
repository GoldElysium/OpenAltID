import Passport from 'passport';
import { UserModel } from '../database/models/UserModel';

module.exports = (passport: Passport.Authenticator) => {
    // Serialize Stuff
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        // eslint-disable-next-line max-len
        // receives the info from the session, is then responsible for getting the info from DB and returning the obj
        // get from DB
        UserModel.findById(id).lean()
            .then((docu) => {
                done(null, docu as unknown as Express.User);
            })
            .catch((error) => {
                console.log(error);
                done(null, null);
            });
    });
};
