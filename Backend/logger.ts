import winston from 'winston';

export default winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            format: winston.format.prettyPrint(),
        }),
        new winston.transports.File({
            filename: 'combined.log',
            format: winston.format.prettyPrint(),
        }),
        new winston.transports.Console({
            format: winston.format.cli(),
        }),
    ],
});
