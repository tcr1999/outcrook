// Utility functions for the Outcrook email detective game

import { CONFIG } from './config.js';

/**
 * Format current date in the format used by emails
 * @returns {string} Formatted date string
 */
export function getCurrentDateString() {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format current time in the format used by emails
 * @returns {string} Formatted time string
 */
export function getCurrentTimeString() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get current timestamp for sorting
 * @returns {number} Current timestamp
 */
export function getCurrentTimestamp() {
    return new Date().getTime();
}

/**
 * Format user name to title case
 * @param {string} name - The name to format
 * @returns {string} Formatted name
 */
export function formatUserName(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Get user name from localStorage
 * @returns {string} User name or 'User' as fallback
 */
export function getUserName() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || 'User';
}

/**
 * Get user name asynchronously (for compatibility)
 * @returns {Promise<string>} Promise that resolves with user name
 */
export async function getUserNameAsync() {
    return new Promise((resolve) => {
        const userName = getUserName();
        resolve(userName);
    });
}

/**
 * Set user name in localStorage
 * @param {string} name - The name to set
 */
export function setUserName(name) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, name);
}

/**
 * Get dark mode setting from localStorage
 * @returns {boolean} True if dark mode is enabled
 */
export function isDarkModeEnabled() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.DARK_MODE) === 'enabled';
}

/**
 * Set dark mode setting in localStorage
 * @param {boolean} enabled - Whether dark mode should be enabled
 */
export function setDarkMode(enabled) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.DARK_MODE, enabled ? 'enabled' : 'disabled');
}

/**
 * Get cursor theme from localStorage
 * @returns {string} Cursor theme or 'default' as fallback
 */
export function getCursorTheme() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.CURSOR_THEME) || CONFIG.CURSOR_THEMES.DEFAULT;
}

/**
 * Set cursor theme in localStorage
 * @param {string} theme - The theme to set
 */
export function setCursorTheme(theme) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURSOR_THEME, theme);
}

/**
 * Generate a unique email ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateEmailId(prefix) {
    return `${prefix}-${Date.now()}`;
}

/**
 * Get sender first name from full sender string
 * @param {string} sender - Full sender string (e.g., "Jane, Director of People")
 * @returns {string} First name
 */
export function getSenderFirstName(sender) {
    return sender.split(',')[0].trim();
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First x coordinate
 * @param {number} y1 - First y coordinate
 * @param {number} x2 - Second x coordinate
 * @param {number} y2 - Second y coordinate
 * @returns {number} Distance between points
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Get random element from array
 * @param {Array} array - Array to get random element from
 * @returns {*} Random element
 */
export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Remove random element from array and return it
 * @param {Array} array - Array to remove element from
 * @returns {*} Removed element
 */
export function removeRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array.splice(randomIndex, 1)[0];
}

/**
 * Generate random jumble character
 * @returns {string} Random jumble character
 */
export function getRandomJumbleChar() {
    return CONFIG.JUMBLE_CHARS[Math.floor(Math.random() * CONFIG.JUMBLE_CHARS.length)];
}

/**
 * Get random spam response
 * @returns {string} Random spam response
 */
export function getRandomSpamResponse() {
    return getRandomElement(CONFIG.SPAM_RESPONSES);
}

/**
 * Create a deep copy of an object
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy of the object
 */
export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if an element is in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a promise that resolves when an event occurs
 * @param {Element} element - Element to listen on
 * @param {string} event - Event name
 * @returns {Promise} Promise that resolves with the event
 */
export function waitForEvent(element, event) {
    return new Promise(resolve => {
        element.addEventListener(event, resolve, { once: true });
    });
}
