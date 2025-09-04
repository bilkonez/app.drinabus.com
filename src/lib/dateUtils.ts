import { format } from 'date-fns';

// Timezone for Europe/Sarajevo
export const TIMEZONE = 'Europe/Sarajevo';

/**
 * Convert UTC date to local time (Europe/Sarajevo)
 */
export const toLocal = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.toLocaleString('sv-SE', { timeZone: TIMEZONE }));
};

/**
 * Format date as dd/mm/yyyy
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
};

/**
 * Format time as HH:mm
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
};

/**
 * Format date and time as dd/mm/yyyy HH:mm
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm');
};

/**
 * Parse time string (HH:mm) and combine with date
 */
export const combineDateTime = (date: Date | string, timeString: string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const combined = new Date(dateObj);
  combined.setHours(hours, minutes, 0, 0);
  
  return combined;
};

/**
 * Extract time string from Date
 */
export const extractTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toTimeString().slice(0, 5); // HH:mm
};

/**
 * Validate time string format (HH:mm)
 */
export const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};