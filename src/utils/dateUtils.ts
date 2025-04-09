/**
 * Date formatting utility functions
 */

/**
 * Format a date to display in a user-friendly format (DD/MM/YYYY)
 * 
 * @param date Date object or ISO string to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
    try {
      // Convert to Date object if string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      // Format as DD/MM/YYYY
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  /**
   * Format a date with time (DD/MM/YYYY HH:MM)
   * 
   * @param date Date object or ISO string to format
   * @returns Formatted date and time string
   */
  export const formatDateTime = (date: Date | string): string => {
    try {
      // Convert to Date object if string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      // Format as DD/MM/YYYY HH:MM
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date and time:', error);
      return 'Invalid Date';
    }
  };
  
  /**
   * Get a relative time string (e.g., "2 hours ago", "Yesterday", etc.)
   * 
   * @param date Date object or ISO string to format
   * @returns Relative time string
   */
  export const getRelativeTimeString = (date: Date | string): string => {
    try {
      // Convert to Date object if string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
      
      // Less than a minute
      if (diffInSeconds < 60) {
        return 'Just now';
      }
      
      // Less than an hour
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      }
      
      // Less than a day
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }
      
      // Less than a week
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        
        if (days === 1) {
          return 'Yesterday';
        }
        
        return `${days} days ago`;
      }
      
      // Default to formatted date
      return formatDate(dateObj);
    } catch (error) {
      console.error('Error getting relative time:', error);
      return 'Invalid Date';
    }
  };
  
  /**
   * Check if a date is today
   * 
   * @param date Date object or ISO string to check
   * @returns Boolean indicating if the date is today
   */
  export const isToday = (date: Date | string): boolean => {
    try {
      // Convert to Date object if string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return false;
      }
      
      const today = new Date();
      
      return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      );
    } catch (error) {
      console.error('Error checking if date is today:', error);
      return false;
    }
  };
  
  /**
   * Format a date range (e.g., "15/01/2023 - 20/01/2023")
   * 
   * @param startDate Start date object or ISO string
   * @param endDate End date object or ISO string
   * @returns Formatted date range string
   */
  export const formatDateRange = (
    startDate: Date | string,
    endDate: Date | string
  ): string => {
    try {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Invalid Date Range';
    }
  };