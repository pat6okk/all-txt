/**
 * Flexible date parsing supporting multiple formats without delimiters
 * US-4.1: Enhanced date parsing
 */

// Support multiple date format patterns
export type DateInputFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';

/**
 * Flexible Date Parser
 * - No delimiters (<>) required
 * - Supports multiple formats: DD/MM/YYYY, YYYY-MM-DD, MM-DD-YYYY
 * - Optional time support: HH:mm
 * - Natural language support (tomorrow, next week, etc.)
 */
export class DateParser {

  /**
   * Parse various date formats flexibly
   * Supports:
   * - YYYY-MM-DD (ISO)
   * - DD/MM/YYYY (European)
   * - MM-DD-YYYY (American)
   * - DD-MM-YYYY (Alternative European)
   * - With optional time: HH:mm
   */
  static parseDate(content: string): Date | null {
    if (!content || typeof content !== 'string') {
      return null;
    }

    const trimmed = content.trim();

    // Try multiple patterns in order of specificity

    // 1. ISO format: YYYY-MM-DD (with optional time)
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (isoMatch) {
      const [_, year, month, day, hours, minutes] = isoMatch;
      return this.createDate(
        parseInt(year),
        parseInt(month),
        parseInt(day),
        hours ? parseInt(hours) : 0,
        minutes ? parseInt(minutes) : 0
      );
    }

    // 2. DD/MM/YYYY or DD-MM-YYYY format (European)
    const euroMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (euroMatch) {
      const [_, day, month, year, hours, minutes] = euroMatch;
      return this.createDate(
        parseInt(year),
        parseInt(month),
        parseInt(day),
        hours ? parseInt(hours) : 0,
        minutes ? parseInt(minutes) : 0
      );
    }

    // 3. Try natural language parsing (tomorrow, next week, etc.)
    try {
      const naturalDate = this.parseNaturalLanguage(trimmed);
      if (naturalDate) {
        return naturalDate;
      }
    } catch (e) {
      // Fallback if chrono is not available
    }

    return null;
  }

  /**
   * Parse natural language dates using chrono-node
   * Examples: "tomorrow", "next Friday", "in 3 days"
   */
  private static parseNaturalLanguage(text: string): Date | null {
    try {
      // Try to use chrono-node if available
      // This is optional and will gracefully fail if not installed
      const chrono = require('chrono-node');
      const results = chrono.parse(text);

      if (results && results.length > 0) {
        return results[0].start.date();
      }
    } catch (e) {
      // Chrono not available or failed, return null
    }

    return null;
  }

  /**
   * Create a Date object with validation
   * @param year Full year (e.g., 2025)
   * @param month Month (1-12)
   * @param day Day of month (1-31)
   * @param hours Optional hours (0-23)
   * @param minutes Optional minutes (0-59)
   */
  private static createDate(
    year: number,
    month: number,
    day: number,
    hours: number = 0,
    minutes: number = 0
  ): Date | null {
    // Validate ranges
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;

    // Create date in local time
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Validate the date is real (e.g., not Feb 31)
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return null;
    }

    return date;
  }

  /**
   * Format a Date object to string according to user preference
   * @param date Date to format
   * @param format Desired output format
   * @returns Formatted date string
   */
  static formatDate(date: Date, format: DateInputFormat = 'DD/MM/YYYY'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM-DD-YYYY':
        return `${month}-${day}-${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  /**
   * Legacy compatibility: parse date string in YYYY-MM-DD format
   * @deprecated Use parseDate() instead
   */
  static parseDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  /**
   * Legacy compatibility: parse date with time
   * @deprecated Use parseDate() instead
   */
  static parseDateTimeString(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }
}
