import React from 'react';

import { isPopupRequest } from './dappFailure';
import { safeHost } from './sunsetAnalytics';
import SunsetInlineNotice from './SunsetInlineNotice';

/**
 * Phase 2 notice above dApp approval screens, which keep working until Phase 3. It never moves
 * the approve and reject buttons, and in a popup it opens migration in a new tab so the app's
 * request is not lost.
 */
export default function DappApprovalSunsetNotice({ callbackUrl }) {
    const host = safeHost(callbackUrl);

    return (
        <SunsetInlineNotice
            centered
            messageKey={
                host ? 'sunset.inline.dappApprovalWithHost' : 'sunset.inline.dappApproval'
            }
            values={host ? { host } : undefined}
            migrateLink={isPopupRequest() ? 'new-tab' : 'same-tab'}
        />
    );
}
