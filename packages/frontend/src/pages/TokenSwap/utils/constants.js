// Amount of decimal places to save in the displayed amounts.
// Not used in the real calculations.
export const DECIMALS_TO_SAFE = 7;

// Amount of milliseconds before making a request for swap information
export const SWAP_INFO_DELAY = 600;

// Token pool IDs are array indexes, we use this value
// to delete the current pool from the state for tokens in the form.
export const IMPOSSIBLE_POOL_ID = -1;

// Used in swap form notifications
export const NOTIFICATION_TYPE = {
    info: 'info',
    warning: 'warning',
    error: 'error',
};
