import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date string to Vietnamese locale (date only)
 * Handles both DD/MM/YYYY HH:mm:ss and ISO formats
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    let date: Date;
    
    // Handle DD/MM/YYYY HH:mm:ss format from API
    if (dateString.includes('/') && dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      // Convert to YYYY-MM-DDTHH:mm:ss format for reliable parsing
      const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
      date = new Date(isoDateStr);
    } else {
      // Handle standard ISO format
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Format date string to Vietnamese locale with date only
 * Handles both DD/MM/YYYY HH:mm:ss and ISO formats
 * Same as formatDate - kept for backward compatibility
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  return formatDate(dateString);
}

/**
 * Format date string to Vietnamese locale with date and time
 * Handles both DD/MM/YYYY HH:mm:ss and ISO formats
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    let date: Date;
    
    // Handle DD/MM/YYYY HH:mm:ss format from API
    if (dateString.includes('/') && dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      // Convert to YYYY-MM-DDTHH:mm:ss format for reliable parsing
      const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
      date = new Date(isoDateStr);
    } else {
      // Handle standard ISO format
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}