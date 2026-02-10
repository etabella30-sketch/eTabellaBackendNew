import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment-timezone';

@Injectable()
export class LogService {
    private loggers: Map<string, { logger: winston.Logger, date: string }> = new Map();

    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly defaultLogger: Logger) { }

    private createLogger(topic: string, appName: string): winston.Logger {
        try {
            const date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD'); // Replace 'Asia/Kolkata' with the desired timezone
            const logDir = path.join('logs', date, appName);

            // Ensure the directory exists
            fs.mkdirSync(logDir, { recursive: true });

            const transport = new winston.transports.File({
                filename: path.join(logDir, `${topic}.log`),
                level: 'info',
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: 'YYYY-MM-DD HH:mm:ss',
                    }),
                    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`),
                ),
            });

            return winston.createLogger({
                level: 'info',
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: 'YYYY-MM-DD HH:mm:ss',
                    }),
                    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`),
                ),
                transports: [transport],
            });
        } catch (error) {
            this.defaultLogger.error(`Failed to create logger for topic ${topic} in app ${appName}: ${error.message}`);
            throw error;
        }
    }

    private getLogger(topic: string, appName: string): winston.Logger {
        try {
            const loggerKey = `${appName}-${topic}`;
            const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

            if (!this.loggers.has(loggerKey) || this.loggers.get(loggerKey)!.date !== currentDate) {
                const logger = this.createLogger(topic, appName);
                this.loggers.set(loggerKey, { logger, date: currentDate });
            }

            return this.loggers.get(loggerKey)!.logger;
        } catch (error) {
            this.defaultLogger.error(`Failed to get logger for topic ${topic} in app ${appName}: ${error.message}`);
            throw error;
        }
    }

    log(value: string, appName: string) {
        try {
            const topic = 'log';
            const logger = this.getLogger(topic, appName);
            logger.info(value);
        } catch (error) {
            this.defaultLogger.error(`Failed to log message: ${error.message}`);
        }
    }

    info(value: string, appName: string) {
        try {
            const topic = 'info';
            const logger = this.getLogger(topic, appName);
            logger.info(value);
        } catch (error) {
            this.defaultLogger.error(`Failed to log info message: ${error.message}`);
        }
    }

    error(value: string, appName: string) {
        try {
            const topic = 'error';
            const logger = this.getLogger(topic, appName);
            logger.error(value);
        } catch (error) {
            this.defaultLogger.error(`Failed to log error message: ${error.message}`);
        }
    }

    warn(value: string, appName: string) {
        try {
            const topic = 'warn';
            const logger = this.getLogger(topic, appName);
            logger.warn(value);
        } catch (error) {
            this.defaultLogger.error(`Failed to log warn message: ${error.message}`);
        }
    }

    debug(value: string, appName: string) {
        try {
            const topic = 'debug';
            const logger = this.getLogger(topic, appName);
            logger.debug(value);
        } catch (error) {
            this.defaultLogger.error(`Failed to log debug message: ${error.message}`);
        }
    }

    // New method to log both error and info into a combined file
    report(message: string, appName: string, type?: 'E' | 'I') {
        try {
            if (!type)
                type = 'I';
            const logger = this.getLogger('combined', appName); // Using a combined log file
            if (type === 'E') {
                logger.error(`ERROR: ${message}`);
            } else if (type === 'I') {
                logger.info(`INFO: ${message}`);
            } else {
                logger.warn(`Unknown log type specified for report: ${type}`);
            }
        } catch (error) {
            this.defaultLogger.error(`Failed to report message: ${error.message}`);
        }
    }
}
