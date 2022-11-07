import React, {FC, useCallback, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { connect} from 'react-redux';
import { Redirect } from 'react-router';

import Checkbox from '../../components/common/Checkbox';
import FormButton from '../../components/common/FormButton';
import Container from '../../components/common/styled/Container.css';
import UserIcon from '../../components/svg/UserIcon';
import UserIconGrey from '../../images/UserIconGrey';
import {currentTargetChecked} from '../../shared/lib/forms/selectors';
import { removeAllAccounts } from './lib/accounts';
import {
    Title,
    ConnectedWallets,
    Description,
    UserItem,
    Username,
    UserContent,
    Label,
    CheckboxCaption,
    CheckboxWrapper,
    Buttons
} from './ui';
import CheckIcon from './ui/CheckIcon';

type RestoreAccountProps = {
    availableAccounts: string[];
}

const RestoreAccount: FC<RestoreAccountProps> = ({
    availableAccounts
}) => {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState('');

    const handleRestore = useCallback(async () => {
        await removeAllAccounts(availableAccounts);
        setRedirectUrl('/recover-seed-phrase');
    }, [availableAccounts]);

    if (redirectUrl.length > 0) {
        return (
            <Redirect
                to={{
                    pathname: redirectUrl,
                }}
            />
        );
    }

    return (
        <Container className='small-centered border'>
            <Title>
                {t('restoreAccount.title')}
            </Title>
            <ConnectedWallets>
                {t('restoreAccount.wallets', {
                    count: availableAccounts.length
                })}
            </ConnectedWallets>
            <Description>
                {t('restoreAccount.description')}
            </Description>

            <div>
                {
                    availableAccounts.map((account) => (
                        <UserItem key={account}>
                            <UserContent>
                                {(
                                    /*@ts-ignore*/
                                    <UserIcon>
                                        <UserIconGrey color='#9a9a9a' />
                                    </UserIcon>
                                )}
                                <Username>
                                    {account}
                                </Username>
                            </UserContent>
                            {checked && (
                                <CheckIcon />
                            )}
                        </UserItem>
                    ))
                }
            </div>
            <CheckboxWrapper>
                <Label>
                    {(
                        /*@ts-ignore*/
                        <Checkbox
                            checked={checked}
                            onChange={currentTargetChecked(setChecked)} />
                    )}
                    <CheckboxCaption>
                        {t('restoreAccount.checkboxCaption')}
                    </CheckboxCaption>
                </Label>
            </CheckboxWrapper>
            <Buttons>
                {(
                    <FormButton
                        /*@ts-ignore*/
                        onClick={console.log}
                        color='light-gray-blue'
                    >
                        {t('restoreAccount.cancelCaption')}
                    </FormButton>
                )}
                {(
                    <FormButton
                        /*@ts-ignore*/
                        disabled={!checked || availableAccounts.length === 0}
                        onClick={handleRestore}
                        color='blue'
                    >
                        {t('restoreAccount.submitCaption')}
                    </FormButton>
                )}
            </Buttons>
        </Container>
    );
};

const mapStateToProps = (state) => ({
    availableAccounts: state.availableAccounts.items,
});

export default connect(mapStateToProps)(RestoreAccount);
