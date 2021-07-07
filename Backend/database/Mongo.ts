import mongoose from 'mongoose';
import logger from '../logger';

export default function () {
    mongoose.connect(process.env.MONGO_DB_URI as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        logger.info('Connected to MongoDB!');
    });

    return db;
}
