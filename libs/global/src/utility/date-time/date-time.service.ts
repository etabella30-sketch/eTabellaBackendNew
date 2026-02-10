import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';

@Injectable()
export class DateTimeService {
     // Get current time in system's local timezone
  getCurrentTime(): string {
    return moment().format();  // Moment uses the system's local timezone by default
  }

  // Get current time in a specified timezone
  getTimeInTimezone(timezone: string): string {
    return moment().tz(timezone).format();
  }

  // Format a given time in a specified timezone
  formatTimeInTimezone(time: Date, timezone: string, format: string = 'YYYY-MM-DD HH:mm:ss Z'): string {
    return moment(time).tz(timezone).format(format);
  }

  // Example method to guess and use the browser's timezone (useful for SSR or API responses)
  getCurrentTimeForBrowser(defaultTimezone: string = 'UTC'): string {
    const guessedTimezone = moment.tz.guess(true) || defaultTimezone;
    return this.getTimeInTimezone(guessedTimezone);
  }
}
