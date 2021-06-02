let mongoose = require("mongoose");

module.exports = function () {
    mongoose.connect('mongodb+srv://botuser:WPkkmEqWkUNqTdSU@hefsverificationbot.lgjlc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log("Connected to database!")
    });

    return db;
}
