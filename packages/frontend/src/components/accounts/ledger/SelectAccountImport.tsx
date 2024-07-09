import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Translate } from 'react-localize-redux';
import { actions as ledgerActions } from '../../../redux/slices/ledger';
import FormButton from '../../common/FormButton';

type Props = {
    ledgerHdPath: string;
    ledgerAccounts: string[];
};

const SelectAccountImport = ({ ledgerHdPath, ledgerAccounts }: Props) => {
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
        await dispatch(ledgerActions.showImportLedgerList(selectedAccountIds));
        await dispatch(
            // @ts-ignore
            ledgerActions.signInWithLedgerAddAndSaveAccounts({
                path: ledgerHdPath,
                accountIds: selectedAccountIds,
            })
        );
        setSubmitLoading(false);
    }

    return (
        <Container>
            <div>ledgerAccounts</div>
            <div className='account-select__wrapper'>
                {ledgerAccounts.map((accountId) => {
                    return (
                        <StyledCard
                            key={accountId}
                            isSelected={!!selectedAccounts[accountId]}
                            onClick={() => {
                                handleSelect(accountId);
                            }}
                        >
                            {accountId}
                        </StyledCard>
                    );
                })}
            </div>
            {/* @ts-ignore */}
            <FormButton
                disabled={isSubmitLoading || !selectedAccountIds.length}
                onClick={handleSubmit}
            >
                <Translate id='button.continue' />
            </FormButton>
        </Container>
    );
};

export default SelectAccountImport;

const Container = styled.div`
    .account-select__wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
`;

const StyledCard = styled.div<{ isSelected: boolean }>`
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    padding: 20px;
    border-color: ${(props) => (props.isSelected ? 'green' : '#ccc')};
    cursor: pointer;
`;
