import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Translate } from 'react-localize-redux';
import { actions as ledgerActions } from '../../../redux/slices/ledger';
import FormButton from '../../common/FormButton';
import UserIconGrey from '../../../images/UserIconGrey';
import IconCheck from '../../../images/IconCheck';
import { makeAccountActive, refreshAccount } from '../../../redux/actions/account';
import { wallet } from '../../../utils/wallet';

type Props = {
    ledgerHdPath?: string;
    accounts: { accountId: string; newKeyPair: string | null }[];
    onSuccess?: () => void;
};

const SelectAccountImport = ({ ledgerHdPath, accounts, onSuccess }: Props) => {
    const accountIds = accounts.map((item) => item.accountId);
    const dispatch = useDispatch();
    const [selectedAccounts, setSelectedAccounts] = useState(
        {} as { [key: string]: boolean }
    );
    const [isSubmitLoading, setSubmitLoading] = useState(false);

    const selectedAccountIds = Object.entries(selectedAccounts)
        .filter(([, val]) => !!val)
        .map(([key]) => key);

    function handleSelect(accountId: string) {
        setSelectedAccounts((checkedItems) => {
            return {
                ...checkedItems,
                [accountId]: !checkedItems[accountId],
            };
        });
    }

    async function handleSubmit() {
        setSubmitLoading(true);
        if (ledgerHdPath) {
            await dispatch(ledgerActions.showImportLedgerList(selectedAccountIds));
            await dispatch(
                // @ts-ignore
                ledgerActions.signInWithLedgerAddAndSaveAccounts({
                    path: ledgerHdPath,
                    accountIds: selectedAccountIds,
                })
            );
        } else {
            await Promise.all(
                selectedAccountIds.map(async (accountId) => {
                    const acc = accounts.find((item) => item.accountId === accountId);
                    await wallet.saveAccount(accountId, acc.newKeyPair);
                })
            );

            const accountId = selectedAccountIds[selectedAccountIds.length - 1];
            await dispatch(makeAccountActive(accountId));
            // @ts-ignore
            await dispatch(refreshAccount());
            onSuccess?.();
        }
        setSubmitLoading(false);
    }

    return (
        <Container>
            <div className='account-select__title'>
                <Translate id={'importAccount.importAccount'} />
            </div>
            <div className='account-select__subtitle'>
                <Translate id={'importAccount.selectAccount'} />
            </div>
            <div className='account-select__wrapper'>
                {accountIds.map((accountId) => {
                    const isSelected = !!selectedAccounts[accountId];
                    return (
                        <StyledCard
                            key={accountId}
                            isSelected={isSelected}
                            onClick={() => {
                                handleSelect(accountId);
                            }}
                        >
                            <UserIcon>
                                <UserIconGrey color='#9a9a9a' />
                            </UserIcon>
                            <div className='account-select__account-id'>{accountId}</div>
                            <div style={{ flexGrow: 1 }}></div>
                            {isSelected && <IconCheck color='#5ace84' stroke='3px' />}
                        </StyledCard>
                    );
                })}
            </div>
            {/* @ts-ignore */}
            <FormButton
                disabled={isSubmitLoading || !selectedAccountIds.length}
                onClick={handleSubmit}
                className='small'
                sending={isSubmitLoading}
            >
                <Translate id='button.continue' />
            </FormButton>
        </Container>
    );
};

export default SelectAccountImport;

const Container = styled.div`
    width: 100%;
    text-align: left;
    .account-select__title {
        margin-bottom: 16px;
        font-weight: bold;
        font-size: 22px;
    }
    .account-select__subtitle {
        margin-bottom: 16px;
    }
    .account-select__wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }
    .account-select__account-id {
        width: 80%;
    }
`;

const StyledCard = styled.div<{ isSelected: boolean }>`
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    padding: 8px 16px;
    border-color: ${(props) => (props.isSelected ? 'green' : '#ccc')};
    cursor: pointer;
    display: flex;
    align-items: center;
    word-break: break-word;
    &:hover {
        background-color: #fafafa;
    }
`;

const UserIcon = styled.div`
    background-size: 21px;
    flex: 0 0 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f8f8f8;
    text-align: center;
    margin: 0 12px 0 0;

    svg {
        width: 26px;
        height: 26px;
        margin: 7px;
    }

    @media (min-width: 940px) {
        display: inline-block;
    }
`;
