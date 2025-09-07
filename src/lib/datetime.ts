import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, parse } from 'date-fns';

export const TZ = 'Europe/Sarajevo';

/**
 * Convert local date and time strings to UTC ISO for database storage
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm format
 * @returns UTC ISO string for database storage
 */
export function toDbIsoFromLocal(dateStr: string, timeStr: string): string {
  // Parse the date and time in local timezone
  const localDateTime = `${dateStr} ${timeStr}`;
  const parsedDate = parse(localDateTime, 'yyyy-MM-dd HH:mm', new Date());
  
  // Convert from local timezone to UTC
  const utcDate = fromZonedTime(parsedDate, TZ);
  
  return utcDate.toISOString();
}

/**
 * Convert DB UTC ISO string to local date string for input[type=date]
 * @param iso - UTC ISO string from database
 * @returns Local date string in YYYY-MM-DD format
 */
export function localDateFromDb(iso: string): string {
  if (!iso) return '';
  return formatInTimeZone(iso, TZ, 'yyyy-MM-dd');
}

/**
 * Convert DB UTC ISO string to local time string for input[type=time]
 * @param iso - UTC ISO string from database
 * @returns Local time string in HH:mm format
 */
export function localTimeFromDb(iso: string): string {
  if (!iso) return '';
  return formatInTimeZone(iso, TZ, 'HH:mm');
}

/**
 * Convert local date string to end of day UTC ISO (23:59:59 local time)
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns UTC ISO string for end of that day in local timezone
 */
export function toDbIsoEndOfDayLocal(dateStr: string): string {
  // Parse the date and set to 23:59:59 local time
  const localDateTime = `${dateStr} 23:59:59`;
  const parsedDate = parse(localDateTime, 'yyyy-MM-dd HH:mm:ss', new Date());
  
  // Convert from local timezone to UTC
  const utcDate = fromZonedTime(parsedDate, TZ);
  
  return utcDate.toISOString();
}

/**
 * Format date for display (dd/MM/yyyy)
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDisplayDate(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TZ, 'dd/MM/yyyy');
}

/**
 * Format time for display (HH:mm)
 * @param date - Date object or ISO string
 * @returns Formatted time string
 */
export function formatDisplayTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TZ, 'HH:mm');
}

/**
 * Format date and time for display (dd/MM/yyyy HH:mm)
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 */
export function formatDisplayDateTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, TZ, 'dd/MM/yyyy HH:mm');
}

/**
 * Get current date in local timezone as YYYY-MM-DD string
 * @returns Current date string for input[type=date]
 */
export function getCurrentLocalDate(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

/**
 * Get current time in local timezone as HH:mm string
 * @returns Current time string for input[type=time]
 */
export function getCurrentLocalTime(): string {
  return formatInTimeZone(new Date(), TZ, 'HH:mm');
}

/**
 * Convert calendar event date from database to display
 * @param dbDate - Database date/datetime
 * @returns Date object for calendar display
 */
export function calendarDateFromDb(dbDate: string): Date {
  if (!dbDate) return new Date();
  // Return the date as-is since the database view already handles timezone conversion
  return new Date(dbDate);
}