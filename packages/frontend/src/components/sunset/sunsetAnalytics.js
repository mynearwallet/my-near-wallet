import * as Sentry from '@sentry/browser';

import CONFIG from '../../config';
import { SUNSET_PHASE } from '../../config/sunset';
import { Mixpanel } from '../../mixpanel';

const EVENTS = {
    FEATURE_BLOCKED: 'sunset_feature_blocked',
    RETIRED_CTA_CLICKED: 'sunset_retired_cta_clicked',
    DAPP_REQUEST_REJECTED: 'sunset_dapp_request_rejected',
    NOTICE_SHOWN: 'sunset_notice_shown',
    NOTICE_CTA_CLICKED: 'sunset_notice_cta_clicked',
    BAR_CTA_CLICKED: 'sunset_bar_cta_clicked',
    INELIGIBLE_GUIDANCE_CLICKED: 'sunset_ineligible_guidance_clicked',
    IMPORT_NONEXISTENT_BLOCKED: 'sunset_import_nonexistent_blocked',
};

const networkId = CONFIG.CURRENT_NEAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

const track = (eventName, properties = {}) =>
    Mixpanel.track(eventName, {
        network_id: networkId,
        sunset_phase: SUNSET_PHASE,
        ...properties,
    });

/** Only ever the host: callback URLs can carry account ids, keys or signatures. */
export const safeHost = (url) => {
    try {
        return new URL(url).host || undefined;
    } catch {
        return undefined;
    }
};

/**
 * `entry` is how the user reached a retired feature: `route` (a direct URL or deep link) or
 * `action` (a thunk or service refused it). An `action` hit means a UI entry point was missed,
 * so it is also reported to Sentry.
 */
export const trackSunsetFeatureBlocked = ({ capability, entry, route }) => {
    track(EVENTS.FEATURE_BLOCKED, { capability, entry, route });
    if (entry === 'action') {
        Sentry.captureMessage(`Sunset: retired action reached (${capability})`, {
            level: 'warning',
            extra: { capability, route },
        });
    }
};

export const trackSunsetRetiredCtaClicked = ({ capability, cta }) =>
    track(EVENTS.RETIRED_CTA_CLICKED, { capability, cta });

export const trackSunsetDappRequestRejected = ({ kind, mode, callbackUrl }) =>
    track(EVENTS.DAPP_REQUEST_REJECTED, { kind, mode, host: safeHost(callbackUrl) });

export const trackSunsetNoticeShown = ({ variant }) =>
    track(EVENTS.NOTICE_SHOWN, { variant });

export const trackSunsetNoticeCtaClicked = ({ variant, cta }) =>
    track(EVENTS.NOTICE_CTA_CLICKED, { variant, cta });

export const trackSunsetBarCtaClicked = ({ entry }) =>
    track(EVENTS.BAR_CTA_CLICKED, { entry });

export const trackSunsetIneligibleGuidanceClicked = ({ availability, action }) =>
    track(EVENTS.INELIGIBLE_GUIDANCE_CLICKED, { availability, action });

export const trackSunsetImportNonExistentBlocked = ({ method }) =>
    track(EVENTS.IMPORT_NONEXISTENT_BLOCKED, { method });

export { EVENTS as SUNSET_ANALYTICS_EVENTS };
