import w from 'winston';

export const logger = w.createLogger({
    level: 'info',
    format: w.format.combine(
        w.format.colorize(),
        w.format.timestamp(),
        w.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new w.transports.Console()
    ]
});