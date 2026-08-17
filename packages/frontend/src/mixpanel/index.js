import mixpanel from 'mixpanel-browser';

import CONFIG from '../config';
import { PostHog } from '../posthog';

function buildTrackingProps() {
    const sanitizedUrl = decodeURI(window.location.href)
        .split('#')[0]
        .replace(/(?:\w{3,12} ){11}(?:\w{3,12})/gi, 'REDACTED')
        .replace(/[\w\d]{64,}/gi, 'REDACTED')
        .replace(/ed25519.+/gi, 'REDACTED');

    return {
        $current_url: encodeURI(sanitizedUrl),
    };
}

// Every method mirrors its events into PostHog (a no-op unless
// BROWSER_POSTHOG_KEY is configured), so existing call sites feed both
// analytics backends without modification.
let Mixpanel = {
    get_distinct_id: () => {},
    identify: (id) => {
        PostHog.identify(id);
    },
    alias: (id) => {
        PostHog.alias(id);
    },
    track: (eventName, props) => {
        PostHog.capture(eventName, props);
    },
    people: {
        set: (props) => {
            PostHog.setPersonProperties(props);
        },
        set_once: (props) => {
            PostHog.setPersonPropertiesOnce(props);
        },
    },
    withTracking: async (name, fn, errorOperation, finalOperation) => {
        try {
            PostHog.capture(`${name} start`);
            await fn();
            PostHog.capture(`${name} finish`);
        } catch (e) {
            PostHog.capture(`${name} fail`, { error: e.message });
            if (errorOperation) {
                await errorOperation(e);
            } else {
                throw e;
            }
        } finally {
            if (finalOperation) {
                await finalOperation();
            }
        }
    },
    register: (props) => {
        PostHog.register(props);
    },
};

if (CONFIG.BROWSER_MIXPANEL_TOKEN) {
    mixpanel.init(CONFIG.BROWSER_MIXPANEL_TOKEN);
    mixpanel.register({ timestamp: new Date().toString(), $referrer: document.referrer });
    Mixpanel = {
        get_distinct_id: () => {
            return mixpanel.get_distinct_id();
        },
        identify: (id) => {
            mixpanel.identify(id);
            PostHog.identify(id);
        },
        alias: (id) => {
            mixpanel.alias(id);
            PostHog.alias(id);
        },
        track: (name, props) => {
            mixpanel.track(name, {
                ...props,
                ...buildTrackingProps(),
            });
            PostHog.capture(name, props);
        },
        people: {
            set: (props) => {
                mixpanel.people.set(props);
                PostHog.setPersonProperties(props);
            },
            set_once: (props) => {
                mixpanel.people.set_once(props);
                PostHog.setPersonPropertiesOnce(props);
            },
        },
        withTracking: async (name, fn, errorOperation, finalOperation) => {
            try {
                mixpanel.track(`${name} start`, buildTrackingProps());
                PostHog.capture(`${name} start`);
                await fn();
                mixpanel.track(`${name} finish`, buildTrackingProps());
                PostHog.capture(`${name} finish`);
            } catch (e) {
                mixpanel.track(`${name} fail`, {
                    error: e.message,
                    ...buildTrackingProps(),
                });
                PostHog.capture(`${name} fail`, { error: e.message });
                if (errorOperation) {
                    await errorOperation(e);
                } else {
                    throw e;
                }
            } finally {
                if (finalOperation) {
                    await finalOperation();
                }
            }
        },
        register: (props) => {
            mixpanel.register(props);
            PostHog.register(props);
        },
    };
}

export { Mixpanel };
