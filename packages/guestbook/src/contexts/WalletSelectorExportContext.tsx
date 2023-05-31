import {
    setupExportSelectorModal,
    type WalletSelectorModal,
} from '@near-wallet-selector/account-export';
import {
    setupWalletSelector,
    type WalletSelector,
    type AccountState,
} from '@near-wallet-selector/core';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import React, {
    useCallback,
    useContext,
    useEffect,
    useState,
    useMemo,
    type ReactNode,
} from 'react';
import { map, distinctUntilChanged } from 'rxjs';

import { Loading } from '../components/Loading';

declare global {
    // eslint-disable-next-line no-unused-vars
    interface Window {
        importSelector: WalletSelector;
        exportModal: WalletSelectorModal;
    }
}

interface ExportAccountSelectorContextValue {
    importSelector: WalletSelector;
    exportModal: WalletSelectorModal;
    accounts: Array<AccountState>;
    accountId: string | null;
}

const ExportAccountSelectorContext =
    React.createContext<ExportAccountSelectorContextValue | null>(null);

export const ExportAccountSelectorContextProvider: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const [importSelector, setSelector] = useState<WalletSelector | null>(null);
    const [modal, setModal] = useState<WalletSelectorModal | null>(null);
    const [accounts, setAccounts] = useState<Array<AccountState>>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const init = useCallback(async () => {
        const _selector = await setupWalletSelector({
            network: 'testnet',
            debug: true,
            modules: [
                setupMyNearWallet({
                    walletUrl: 'https://localhost:1234',
                }),
            ],
        });
        /**
         * Insert list of accounts to be imported here
         * accounts: [{ accountId: "test.testnet", privateKey: "ed25519:..."}, ...]
         */
        const _modal = setupExportSelectorModal(_selector, {
            accounts: [
                {
                    accountId: 'hoemun.testnet',
                    privateKey:
                        'ed25519:31zA4T62zDwx2bUQANmu5s8AmtXLTYCzDbduYB2bTLjVpp4FS6mazz9CCUrT6Nc5Pa6gzuRc1sYV66Ka1mxBMABC',
                },
            ],
            onComplete: (completeProps) => {
                console.log(
                    `${completeProps.accounts} exported to ${completeProps.walletName}`
                );
            },
        });
        const state = _selector.store.getState();
        setAccounts(state.accounts);

        // this is added for debugging purpose only
        // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
        window.importSelector = _selector;
        window.exportModal = _modal;

        setSelector(_selector);
        setModal(_modal);
        setLoading(false);
    }, []);

    useEffect(() => {
        init().catch((err) => {
            console.error(err);
            alert('Failed to initialise wallet selector');
        });
    }, [init]);

    useEffect(() => {
        if (!importSelector) {
            return;
        }

        const subscription = importSelector.store.observable
            .pipe(
                // @ts-ignore
                map((state) => state.accounts),
                distinctUntilChanged()
            )
            .subscribe((nextAccounts) => {
                setAccounts(nextAccounts);
            });

        return () => subscription.unsubscribe();
    }, [importSelector]);

    const exportWalletSelectorContextValue = useMemo<ExportAccountSelectorContextValue>(
        () => ({
            importSelector: importSelector!,
            exportModal: modal!,
            accounts,
            accountId: accounts.find((account) => account.active)?.accountId || null,
        }),
        [importSelector, modal, accounts]
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <ExportAccountSelectorContext.Provider value={exportWalletSelectorContextValue}>
            {children}
        </ExportAccountSelectorContext.Provider>
    );
};

export function useExportAccountSelector() {
    const context = useContext(ExportAccountSelectorContext);

    if (!context) {
        throw new Error(
            'useExportAccountSelector must be used within a ExportAccountSelectorContextProvider'
        );
    }

    return context;
}
