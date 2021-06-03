let mongoose = require('mongoose')

module.exports = function () {
    mongoose.connect(
        process.env.MONGO_DB_URI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )

    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'connection error:'))
    db.once('open', function () {
        console.log('Connected to database!')
    })

    return db
}
