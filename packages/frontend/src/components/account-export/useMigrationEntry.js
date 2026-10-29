import { useEffect, useState } from 'react';

import {
    getMeteorNewKeyTransferSessions,
    hasJournaledMeteorNewKeyVerification,
} from '../../services/meteorConnect';
import {
    findResumableNewKeyTransfer,
    summarizeNewKeyTransferSession,
} from '../../services/newKeyTransferState';
import { trackMigrationEntryLoadFailed } from './accountExportAnalytics';

export const MIGRATION_START_ROUTE = '/export-accounts/select';

/**
 * Where an unfinished transfer picks up. A resolved start moves directly into step 2, whether or
 * not an AddKey intent has been journaled yet; the activation screen asks the journal what work is
 * actually left and waits for the corresponding user action.
 */
const resumeRoute = (summary) =>
    summary == null
        ? MIGRATION_START_ROUTE
        : {
              pathname: '/export-accounts/new-key-activation',
              state: { clientTransferId: summary.clientTransferId, isResume: true },
          };

/**
 * The one place every "Migrate" call to action gets its destination from: the start of the
 * export flow, or the step an unfinished Meteor transfer is waiting on. Reads only the local
 * transfer journal, never the chain, so it is cheap enough for any page.
 */
export default function useMigrationEntry() {
    const [pendingSummary, setPendingSummary] = useState(null);
    const [resumeStage, setResumeStage] = useState(undefined);

    useEffect(() => {
        let isActive = true;
        void (async () => {
            try {
                const sessions = await getMeteorNewKeyTransferSessions();
                const resumable = findResumableNewKeyTransfer(sessions);
                const summary = summarizeNewKeyTransferSession(resumable);
                let nextResumeStage;
                if (summary?.isAwaitingWalletCompletion) {
                    nextResumeStage = 'wallet_completion';
                } else if (summary != null) {
                    try {
                        nextResumeStage = (await hasJournaledMeteorNewKeyVerification(
                            summary.transferSessionId
                        ))
                            ? 'verify_keys'
                            : 'activate_keys';
                    } catch (error) {
                        trackMigrationEntryLoadFailed(error);
                        nextResumeStage = 'activate_keys';
                    }
                }
                if (isActive) {
                    setPendingSummary(summary);
                    setResumeStage(nextResumeStage);
                }
            } catch (error) {
                trackMigrationEntryLoadFailed(error);
                // A journal this cannot read is not something to shout about here; the export
                // screens report it properly. Offer the ordinary entry point.
            }
        })();
        return () => {
            isActive = false;
        };
    }, []);

    return {
        to: resumeRoute(pendingSummary),
        // For a new tab, which cannot carry router state: the activation screen picks up the
        // same resumable transfer on its own when it is opened without one.
        href:
            pendingSummary == null
                ? MIGRATION_START_ROUTE
                : '/export-accounts/new-key-activation',
        isResume: pendingSummary != null,
        resumeStage,
    };
}
