import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import FormButton from '../../../components/common/FormButton';
import CONFIG from '../../../config';
import useIsMounted from '../../../hooks/useIsMounted';
import { actions as swapActions } from '../../../redux/slices/swap';
import fungibleTokenExchange from '../../../services/tokenExchange';
import { fromRaw } from '../../../services/tokenExchange/quotes';
import { openTransactionInExplorer } from '../../../utils/window';

export default function RecoverableBalances({ account }) {
    const dispatch = useDispatch();
    const isMounted = useIsMounted();
    const accountId = account?.accountId;
    const currentAccountId = useRef(accountId);
    currentAccountId.current = accountId;
    const isCurrent = () => isMounted() && currentAccountId.current === accountId;
    const [balances, setBalances] = useState(null);
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState('');
    const [pending, setPending] = useState(null);

    const refresh = async () => {
        if (!accountId || busy) {
            return;
        }
        setBusy('refresh');
        setMessage('');
        try {
            const result = await fungibleTokenExchange.getRecoverableBalances(account);
            if (isCurrent()) {
                setBalances(result || []);
                if (pending && !pending.hash) {
                    setPending(null);
                }
            }
        } catch (error) {
            if (isCurrent()) {
                setMessage(error.message || 'Unable to check swap balances.');
            }
        } finally {
            if (isCurrent()) {
                setBusy('');
            }
        }
    };

    const handleResult = (tokenId, result) => {
        if (result.retry) {
            setMessage('Connect your Ledger and try again.');
            return;
        }
        if (result.unconfirmed) {
            const hash = result.swapTxHash || pending?.hash || '';
            setPending({ tokenId, hash });
            setMessage(
                hash
                    ? 'Withdrawal status unknown. Check the transaction before trying again.'
                    : 'Withdrawal status unknown. Check your account activity, then refresh balances.'
            );
            return;
        }
        setPending(null);
        if (result.success) {
            setBalances((items) => items.filter((item) => item.tokenId !== tokenId));
            dispatch(swapActions.updateTokensBalance({ accountId, tokenIds: [tokenId] }));
        }
        setMessage(
            result.success
                ? 'Balance withdrawn.'
                : result.failReason || 'Withdrawal failed.'
        );
    };

    const runWithdrawal = async (tokenId, hash) => {
        if (!accountId || busy || (pending && !hash)) {
            return;
        }
        setBusy(hash ? 'status' : `withdraw:${tokenId}`);
        setMessage('');
        try {
            const result = hash
                ? await fungibleTokenExchange.checkWithdrawalResult({
                      account,
                      tokenId,
                      hash,
                  })
                : await fungibleTokenExchange.withdraw({ account, tokenId, isCurrent });
            if (isCurrent()) {
                handleResult(tokenId, result);
            }
        } catch (error) {
            if (isCurrent()) {
                setMessage(error.message || 'Withdrawal failed.');
            }
        } finally {
            if (isCurrent()) {
                setBusy('');
            }
        }
    };

    useEffect(() => {
        refresh();
    }, [accountId]);

    if (CONFIG.CURRENT_NEAR_NETWORK !== 'mainnet' || (!balances?.length && !pending)) {
        return null;
    }

    return (
        <section className='border-t border-gray-200 mt-5 pt-3'>
            <FormButton
                color='link'
                type='button'
                onClick={refresh}
                disabled={!accountId || !!busy}
            >
                {busy === 'refresh'
                    ? 'Checking swap balances...'
                    : 'Refresh swap balances'}
            </FormButton>
            {balances?.map(({ tokenId, amount, metadata }) => (
                <div className='flex items-center justify-between gap-3' key={tokenId}>
                    <span className='min-w-0 break-all'>
                        {Number.isInteger(metadata?.decimals)
                            ? fromRaw(amount, metadata.decimals)
                            : `${amount} units`}{' '}
                        {metadata?.symbol || tokenId}
                    </span>
                    <FormButton
                        color='link'
                        type='button'
                        onClick={() => runWithdrawal(tokenId)}
                        disabled={!!busy || !!pending}
                    >
                        {busy === `withdraw:${tokenId}` ? 'Withdrawing...' : 'Withdraw'}
                    </FormButton>
                </div>
            ))}
            {message && <p role='status'>{message}</p>}
            {pending?.hash && (
                <div className='flex flex-wrap gap-3'>
                    <FormButton
                        color='link'
                        type='button'
                        onClick={() => runWithdrawal(pending.tokenId, pending.hash)}
                        disabled={!!busy}
                    >
                        {busy === 'status' ? 'Checking...' : 'Check transaction status'}
                    </FormButton>
                    <FormButton
                        color='link'
                        type='button'
                        onClick={() => openTransactionInExplorer(pending.hash)}
                    >
                        View transaction
                    </FormButton>
                </div>
            )}
        </section>
    );
}
