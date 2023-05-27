import {
    setupWalletSelector,
    type AccountState,
    type WalletSelector,
} from '@near-wallet-selector/core';
import { setupModal, type WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import React, {
    useCallback,
    useContext,
    useEffect,
    useState,
    useMemo,
    type ReactNode,
} from 'react';
import { distinctUntilChanged, map } from 'rxjs';

import { Loading } from '../components/Loading';
import { CONTRACT_ID } from '../constants';

declare global {
    // eslint-disable-next-line no-unused-vars
    interface Window {
        selector: WalletSelector;
        modal: WalletSelectorModal;
    }
}

interface WalletSelectorContextValue {
    selector: WalletSelector;
    modal: WalletSelectorModal;
    accounts: Array<AccountState>;
    accountId: string | null;
}

const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(
    null
);

export const WalletSelectorContextProvider: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const [selector, setSelector] = useState<WalletSelector | null>(null);
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
        const _modal = setupModal(_selector, {
            contractId: CONTRACT_ID,
        });
        const state = _selector.store.getState();
        setAccounts(state.accounts);

        // this is added for debugging purpose only
        // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
        window.selector = _selector;
        window.modal = _modal;

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
        if (!selector) {
            return;
        }

        const subscription = selector.store.observable
            .pipe(
                // @ts-ignore
                map((state) => state.accounts),
                distinctUntilChanged()
            )
            .subscribe((nextAccounts) => {
                console.log('Accounts Update', nextAccounts);

                setAccounts(nextAccounts);
            });

        const onHideSubscription = modal!.on('onHide', ({ hideReason }) => {
            console.log(`The reason for hiding the modal ${hideReason}`);
        });

        return () => {
            subscription.unsubscribe();
            onHideSubscription.remove();
        };
    }, [selector, modal]);

    const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
        () => ({
            selector: selector!,
            modal: modal!,
            accounts,
            accountId: accounts.find((account) => account.active)?.accountId || null,
        }),
        [selector, modal, accounts]
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <WalletSelectorContext.Provider value={walletSelectorContextValue}>
            {children}
        </WalletSelectorContext.Provider>
    );
};

export function useWalletSelector() {
    const context = useContext(WalletSelectorContext);

    if (!context) {
        throw new Error(
            'useWalletSelector must be used within a WalletSelectorContextProvider'
        );
    }

    return context;
}
