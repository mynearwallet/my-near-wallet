import { assertSunsetCapability, isSunsetCapabilityEnabled } from '../../config/sunset';
import { trackSunsetFeatureBlocked } from './sunsetAnalytics';

/**
 * The action-layer guard used by thunks and services. A retired action reaching this point means
 * some UI entry point was missed, so it is reported (analytics and Sentry) before the throw.
 */
export const guardSunsetCapability = (capability) => {
    if (!isSunsetCapabilityEnabled(capability)) {
        trackSunsetFeatureBlocked({ capability, entry: 'action' });
    }
    assertSunsetCapability(capability);
};
