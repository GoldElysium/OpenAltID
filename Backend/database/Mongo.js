const mongoose = require('mongoose');
const { logger } = require('../logger');

module.exports = () => {
    mongoose.connect(process.env.MONGO_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        logger.info('Connected to MongoDB!');
    });

    return db;
};
