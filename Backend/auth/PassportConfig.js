const { UserModel } = require('../database/models/UserModel');

module.exports = (passport) => {
    // Serialize Stuff
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        // eslint-disable-next-line max-len
        // receives the info from the session, is then responsible for getting the info from DB and returning the obj
        // get from DB
        UserModel.findById(id)
            .then((docu) => {
                done(null, docu);
            })
            .catch((error) => {
                console.log(error);
                done(null, null);
            });
    });
};
