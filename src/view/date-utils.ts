
/**
 * Date utility class
 */
export class DateUtils {
  /**
   * Format a date for display with relative time indicators
   * @param date The date to format
   * @param includeTime Whether to include time if available
   * @returns Formatted date string
   */
  static formatDateForDisplay(date: Date | null, includeTime = false): string {
    if (!date) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formatTime = (d: Date) => {
      // Format time showing hours and minutes (no leading zero for hour).
      // Keep locale behavior (12/24h) but normalize AM/PM to lowercase when present.
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return time.replace(/AM|PM/i, (m) => m.toLowerCase());
    };

    const formatFullDate = (d: Date) => {
      // Return YYYY-MM-DD format to match user expectation (ISO-like)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }


    // Determine relative text
    let relativeText = '';
    if (diffDays === 0) {
      relativeText = 'Today';
    } else if (diffDays === 1) {
      relativeText = 'Tomorrow';
    } else if (diffDays === -1) {
      relativeText = 'Yesterday';
    } else if (diffDays > 0) {
      relativeText = `${diffDays} days from now`;
    } else {
      relativeText = `${Math.abs(diffDays)} days ago`;
    }

    // Check for time
    const timeStr = (includeTime && (date.getHours() !== 0 || date.getMinutes() !== 0))
      ? ` ${formatTime(date)}`
      : '';

    // Combine: "YYYY-MM-DD (Relative)" (+ time if exists)
    return `${formatFullDate(date)}${timeStr} (${relativeText})`;
  }
}
