let { UserModel } = require('../database/models/UserModel');

module.exports = function (passport) {
    // Serialize Stuff
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
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
