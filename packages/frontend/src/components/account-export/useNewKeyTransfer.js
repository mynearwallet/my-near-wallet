import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';

import { getMeteorNewKeyTransferSessions } from '../../services/meteorConnect';
import {
    describeNewKeyTransferError,
    findResumableNewKeyTransfer,
    findSecuredNewKeyTransfer,
    summarizeNewKeyTransferSession,
} from '../../services/newKeyTransferState';

/**
 * Load the transfer a new-key export screen is about.
 *
 * The screens are told which transfer they are on through router state, but that is lost on a
 * reload — and this flow spans on-chain work a user may well reload in the middle of. So the
 * durable SDK journal, not router state, is the source of truth: the id is only a hint, and a
 * screen reached without one falls back to the newest transfer that still has work left.
 *
 * `fallback: 'secured'` is for the completion screen, which by definition no longer has work left
 * and would otherwise never find itself. It resolves to the newest transfer with at least one
 * SECURED account — never the raw latest session, which after a failed later attempt is a
 * different transfer than the one the user finished (MNW-4).
 */
export default function useNewKeyTransfer({
    fallback = 'resumable',
    redirectWhenVerified = false,
} = {}) {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const requestedId = location.state?.clientTransferId;
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    // Survives across reloads within one mount so a slow reload cannot redirect twice.
    const hasRedirected = useRef(false);

    const reload = useCallback(async () => {
        try {
            const sessions = await getMeteorNewKeyTransferSessions();
            const found =
                (requestedId != null &&
                    sessions.find(
                        (candidate) => candidate.clientTransferId === requestedId
                    )) ||
                (fallback === 'secured'
                    ? findSecuredNewKeyTransfer(sessions)
                    : findResumableNewKeyTransfer(sessions));
            setSession(found || null);
            setErrorMessage('');
            return { session: found || null, failed: false };
        } catch (error) {
            const { i18nKey, fallback: message } = describeNewKeyTransferError(error);
            setErrorMessage(i18nKey ? t(i18nKey) : message);
            // A journal this screen could not read is not the same as no transfer to show. Say so
            // and stay put; bouncing to account selection would hide the one thing worth reading.
            return { session: null, failed: true };
        } finally {
            setIsLoading(false);
        }
    }, [fallback, requestedId, t]);

    useEffect(() => {
        let isActive = true;
        void (async () => {
            const { session: found, failed } = await reload();
            if (!isActive || hasRedirected.current || failed) {
                return;
            }
            if (found == null) {
                hasRedirected.current = true;
                history.replace('/export-accounts/select');
                return;
            }
            if (redirectWhenVerified && found.phase === 'destination_keys_verified') {
                hasRedirected.current = true;
                history.replace('/export-accounts/new-key-activated', {
                    clientTransferId: found.clientTransferId,
                });
            }
        })();
        return () => {
            isActive = false;
        };
    }, [history, redirectWhenVerified, reload]);

    return {
        session,
        summary: summarizeNewKeyTransferSession(session),
        isLoading,
        errorMessage,
        setErrorMessage,
        reload,
    };
}
