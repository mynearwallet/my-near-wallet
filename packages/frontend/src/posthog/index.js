import posthog from 'posthog-js';

import CONFIG from '../config';

// Strip seed phrases, hashes and keys out of anything URL-shaped before it
// leaves the browser. Mirrors the sanitization used by src/mixpanel/index.js.
function sanitizeUrl(url) {
    return encodeURI(
        decodeURI(url)
            .split('#')[0]
            .replace(/(?:\w{3,12} ){11}(?:\w{3,12})/gi, 'REDACTED')
            .replace(/[\w\d]{64,}/gi, 'REDACTED')
            .replace(/ed25519.+/gi, 'REDACTED')
    );
}

function sanitizeProperties(properties) {
    ['$current_url', '$referrer', '$pathname', '$prev_pageview_pathname'].forEach(
        (key) => {
            if (typeof properties[key] === 'string') {
                properties[key] = sanitizeUrl(properties[key]);
            }
        }
    );
    return properties;
}

let PostHog = {
    get_distinct_id: () => {},
    identify: (id) => {},
    alias: (id) => {},
    capture: (eventName, props) => {},
    capturePageview: () => {},
    register: (props) => {},
    setPersonProperties: (props) => {},
    setPersonPropertiesOnce: (props) => {},
    reset: () => {},
};

if (CONFIG.BROWSER_POSTHOG_KEY) {
    posthog.init(CONFIG.BROWSER_POSTHOG_KEY, {
        api_host: CONFIG.BROWSER_POSTHOG_HOST || 'https://us.i.posthog.com',
        // The wallet handles seed phrases and private keys, so nothing may be
        // captured automatically: no DOM autocapture, no session recording,
        // and only manual (sanitized) pageviews.
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        rageclick: false,
        sanitize_properties: sanitizeProperties,
        persistence: 'localStorage+cookie',
    });
    posthog.register({ wallet_environment: CONFIG.NEAR_WALLET_ENV });

    PostHog = {
        get_distinct_id: () => posthog.get_distinct_id(),
        identify: (id) => posthog.identify(id),
        alias: (id) => posthog.alias(id),
        capture: (eventName, props) => posthog.capture(eventName, props),
        capturePageview: () => posthog.capture('$pageview'),
        register: (props) => posthog.register(props),
        setPersonProperties: (props) => posthog.setPersonProperties(props),
        setPersonPropertiesOnce: (props) => posthog.setPersonProperties({}, props),
        reset: () => posthog.reset(),
    };

    PostHog.capturePageview();
}

export { PostHog };
