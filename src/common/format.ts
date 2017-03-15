/**
 * Converts a milliseconds time value to an ISO date string.
 * @param millis Time in milliseconds
 * @returns {string} ISO date string
 */
export function formatMillisAsISODateString(millis: number) {
    return new Date(millis).toISOString().slice(0, 10);
}

/**
 * Converts a time value to an ISO date string.
 * @param date Time as date
 * @returns {string} ISO date string
 */
export function formatDateAsISODateString(date: Date) {
    return date.toISOString().slice(0, 10);
}
