import React from 'react';
import { Translate } from 'react-localize-redux';

import { LOGIN_ACCESS_TYPES } from '../../../routes/LoginWrapper';
import AccountSelector from '../../accounts/account_selector/AccountSelector';
import FormButton from '../../common/FormButton';
import FormButtonGroup from '../../common/FormButtonGroup';
import LoadingDots from '../../common/loader/LoadingDots';
import Container from '../../common/styled/Container.css';
import DepositNearBanner from '../../wallet/DepositNearBanner';
import ConnectWithApplication from './ConnectWithApplication';
import ConnectWithPrivateShard from './ConnectWithPrivateShard';
import LoginStyle from './style/LoginStyle.css';

export default ({
    signedInAccountId,
    availableAccounts,
    accountsBalances,
    getAccountBalance,
    onSelectAccount,
    onSignInToDifferentAccount,
    onClickCancel,
    onClickNext,
    loginAccessType,
    appReferrer,
    contractIdUrl,
    failureAndSuccessUrlsAreValid,
    accountExists,
    privateShardInfo,
}) => (
    <Container className='small-centered border'>
        <LoginStyle
            className={
                loginAccessType === LOGIN_ACCESS_TYPES.FULL_ACCESS ? 'full-access' : ''
            }
        >
            <LoginHeader
                privateShardInfo={privateShardInfo}
                loginAccessType={loginAccessType}
            ></LoginHeader>
            {privateShardInfo ? (
                <ConnectWithPrivateShard privateShardInfo={privateShardInfo} />
            ) : (
                <ConnectWithApplication
                    appReferrer={appReferrer}
                    contractIdUrl={contractIdUrl}
                />
            )}

            <LoadingDots />
            <AccountSelector
                signedInAccountId={signedInAccountId}
                availableAccounts={availableAccounts}
                accountsBalances={accountsBalances}
                getAccountBalance={getAccountBalance}
                onSelectAccount={onSelectAccount}
                onSignInToDifferentAccount={onSignInToDifferentAccount}
                showBalanceInUSD={false}
            />
            {accountExists === false && <DepositNearBanner />}
            <FormButtonGroup>
                <FormButton
                    onClick={onClickCancel}
                    color='gray-blue'
                    disabled={!failureAndSuccessUrlsAreValid}
                    data-test-id='cancel-select-account'
                >
                    <Translate id='button.cancel' />
                </FormButton>
                <FormButton
                    onClick={onClickNext}
                    disabled={!failureAndSuccessUrlsAreValid || accountExists === false}
                    data-test-id='continue-with-current-account'
                >
                    <Translate id='button.next' />
                </FormButton>
            </FormButtonGroup>
        </LoginStyle>
    </Container>
);

const LoginHeader = ({ loginAccessType, privateShardInfo }) => {
    const titleId = !!privateShardInfo
        ? 'login.v2.connectWithNear.privateShardTitle'
        : 'login.v2.connectWithNear.title';
    const descId = !!privateShardInfo
        ? 'login.v2.connectWithNear.privateShardDesc'
        : 'login.v2.connectWithNear.desc';
    return (
        <>
            <h3>
                <Translate id={titleId} />
            </h3>
            <div className='desc' data-test-id={`type-${loginAccessType}`}>
                <Translate>
                    {({ translate }) => (
                        <Translate
                            id={descId}
                            data={{
                                accessType: translate(
                                    `login.v2.connectWithNear.${loginAccessType}`
                                ),
                                shardId: privateShardInfo?.shardId,
                            }}
                        />
                    )}
                </Translate>
            </div>
        </>
    );
};
