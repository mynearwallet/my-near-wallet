import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import CONFIG from '../../config';

const VERSION_URL = '/version.json';
// At most one check a minute, from page changes and the tab coming back into view.
const MIN_CHECK_INTERVAL_MILLIS = 60 * 1000;
// A tab that stays on one page still checks now and then.
const POLL_INTERVAL_MILLIS = 5 * 60 * 1000;

export const fetchDeployedBuildId = async () => {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
        return null;
    }
    const { buildId } = await response.json();
    return typeof buildId === 'string' ? buildId : null;
};

export const isNewBuildDeployed = (runningBuildId, deployedBuildId) =>
    !!runningBuildId && !!deployedBuildId && runningBuildId !== deployedBuildId;

/**
 * Whether a newer build than this tab's is live. The sunset phase is a build flag, so a tab
 * left open across a phase deployment keeps the old phase until it reloads.
 */
export default function useNewBuildAvailable({ buildId = CONFIG.BUILD_ID } = {}) {
    const { pathname } = useLocation();
    const [isAvailable, setIsAvailable] = useState(false);
    // The page has only just loaded this build, so the first check can wait.
    const lastCheckRef = useRef(Date.now());

    const check = useCallback(async () => {
        if (!buildId || isAvailable) {
            return;
        }
        const now = Date.now();
        if (now - lastCheckRef.current < MIN_CHECK_INTERVAL_MILLIS) {
            return;
        }
        lastCheckRef.current = now;
        try {
            if (isNewBuildDeployed(buildId, await fetchDeployedBuildId())) {
                setIsAvailable(true);
            }
        } catch {
            // Offline, or a deployment from before version.json existed: check again later.
        }
    }, [buildId, isAvailable]);

    useEffect(() => {
        void check();
    }, [pathname]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void check();
            }
        };
        const timer = setInterval(onVisible, POLL_INTERVAL_MILLIS);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [check]);

    return isAvailable;
}
