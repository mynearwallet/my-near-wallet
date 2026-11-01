import { ConnectedRouter, getRouter } from 'connected-react-router';
import isString from 'lodash.isstring';
import { parseSeedPhrase } from 'near-seed-phrase';
import PropTypes from 'prop-types';
import { stringify } from 'query-string';
import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { withLocalize } from 'react-localize-redux';
import { connect } from 'react-redux';
import { Redirect, Switch } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';

import AccessKeysWrapper from '../components/access-keys/v2/AccessKeysWrapper';
import AutoImportWrapper from '../components/accounts/auto_import/AutoImportWrapper';
import BatchImportAccounts from '../components/accounts/batch_import_accounts';
import BatchLedgerExport from '../components/accounts/batch_ledger_export';
import ExistingAccountWrapper from '../components/accounts/create/existing_account/ExistingAccountWrapper';
import InitialDepositWrapper from '../components/accounts/create/initial_deposit/InitialDepositWrapper';
import CreateAccountLanding from '../components/accounts/create/landing/CreateAccountLanding';
import VerifyAccountWrapper from '../components/accounts/create/verify_account/VerifyAccountWrapper';
import CreateAccountWithRouter from '../components/accounts/CreateAccount';
import LedgerConfirmActionModal from '../components/accounts/ledger/LedgerConfirmActionModal';
import ExternalRedirectModal from '../components/common/ExternalRedirectModal';
import LedgerConnectModal from '../components/accounts/ledger/LedgerConnectModal/LedgerConnectModalWrapper';
import SetupLedgerWithRouter from '../components/accounts/ledger/SetupLedger';
import SetupLedgerSuccessWithRouter from '../components/accounts/ledger/SetupLedgerSuccess';
import SignInLedgerWrapper from '../components/accounts/ledger/SignInLedgerWrapper';
import LinkdropLandingWithRouter from '../components/accounts/LinkdropLanding';
import { ChangePasswordPage } from '../components/accounts/password_encryption/ChangePasswordPage';
import { SetPasswordPage } from '../components/accounts/password_encryption/SetPasswordPage';
import RecoverAccountPrivateKey from '../components/accounts/RecoverAccountPrivateKey';
import RecoverAccountSeedPhraseWithRouter from '../components/accounts/RecoverAccountSeedPhrase';
import RecoverAccountWrapper from '../components/accounts/RecoverAccountWrapper';
import SetupRecoveryMethodWithRouter from '../components/accounts/recovery_setup/SetupRecoveryMethod';
import SetupImplicitWithRouter from '../components/accounts/SetupImplicit';
import SetupSeedPhraseWithRouter from '../components/accounts/SetupSeedPhrase';
import { EnableTwoFactor } from '../components/accounts/two_factor/EnableTwoFactor';
import TwoFactorVerifyModal from '../components/accounts/two_factor/TwoFactorVerifyModal';
import { BuyNear } from '../components/buy/BuyNear';
import Bootstrap from '../components/common/Bootstrap';
import Footer from '../components/common/Footer';
import GlobalAlert from '../components/common/GlobalAlert';
import GuestLandingRoute from '../components/common/GuestLandingRoute';
import NetworkBanner from '../components/common/NetworkBanner';
import PasswordProtectedRoute from '../components/common/routing/PasswordProtectedRoute';
import PrivateRoute from '../components/common/routing/PrivateRoute';
import PublicRoute from '../components/common/routing/PublicRoute';
import Route from '../components/common/routing/Route';
import Updater from '../components/common/Updater';
import Connection from '../components/connection/Connection';
import { ExploreContainer } from '../components/explore/ExploreContainer';
import GlobalStyle from '../components/GlobalStyle';
import LoginCliLoginSuccess from '../components/login/LoginCliLoginSuccess';
import NavigationWrapper from '../components/navigation/NavigationWrapper';
import NFTDetailWrapper from '../components/nft/NFTDetailWrapper';
import PageNotFound from '../components/page-not-found/PageNotFound';
import Privacy from '../components/privacy/Privacy';
import Profile from '../components/profile/Profile';
import ReceiveContainerWrapper from '../components/receive-money/ReceiveContainerWrapper';
import SendContainerWrapper from '../components/send/SendContainerWrapper';
import StakingContainer from '../components/staking/StakingContainer';
import Terms from '../components/terms/Terms';
import './index.css';
import WalletMigration from '../components/wallet-migration/WalletMigration';
import AccountExportSelect from '../components/account-export/AccountExportSelect';
import AccountExportSuccess from '../components/account-export/AccountExportSuccess';
import AccountExportMethod from '../components/account-export/AccountExportMethod';
import NearDotComGuide from '../components/account-export/NearDotComGuide';
import AccountExportManual from '../components/account-export/AccountExportManual';
import AccountExportRemove from '../components/account-export/AccountExportRemove';
import AccountExportNewKeyStart from '../components/account-export/AccountExportNewKeyStart';
import AccountExportNewKeyRecovery from '../components/account-export/AccountExportNewKeyRecovery';
import AccountExportNewKeyActivation from '../components/account-export/AccountExportNewKeyActivation';
import AccountExportNewKeyActivated from '../components/account-export/AccountExportNewKeyActivated';
import CONFIG from '../config';
import { isSunsetCapabilityEnabled } from '../config/sunset';
import { Mixpanel } from '../mixpanel/index';
import { PostHog } from '../posthog';
import TokenSwap from '../pages/TokenSwap';
import TransactionHistory from '../pages/TransactionHistory';
import * as accountActions from '../redux/actions/account';
import { handleClearAlert } from '../redux/reducers/status';
import { selectAccountSlice } from '../redux/slices/account';
import { actions as flowLimitationActions } from '../redux/slices/flowLimitation';
import { actions as tokenFiatValueActions } from '../redux/slices/tokenFiatValues';
import CreateImplicitAccountWrapper from '../routes/CreateImplicitAccountWrapper';
import ImportAccountWithLinkWrapper from '../routes/ImportAccountWithLinkWrapper';
import LoginWrapper from '../routes/LoginWrapper';
import SetupLedgerNewAccountWrapper from '../routes/SetupLedgerNewAccountWrapper';
import SetupPassphraseNewAccountWrapper from '../routes/SetupPassphraseNewAccountWrapper';
import SetupRecoveryImplicitAccountWrapper from '../routes/SetupRecoveryImplicitAccountWrapper';
import SignMessageWrapper from '../routes/SignMessageWrapper';
import SignWrapper from '../routes/SignWrapper';
import VerifyOwnerWrapper from '../routes/VerifyOwnerWrapper';
import WalletWrapper from '../routes/WalletWrapper';
import translations_en from '../translations/locales/en/translation.json';
import translations_it from '../translations/locales/it/translation.json';
import translations_pt from '../translations/locales/pt/translation.json';
import translations_ru from '../translations/locales/ru/translation.json';
import translations_tr from '../translations/locales/tr/translation.json';
import translations_ua from '../translations/locales/ua/translation.json';
import translations_vi from '../translations/locales/vi/translation.json';
import translations_zh_hans from '../translations/locales/zh-hans/translation.json';
import translations_zh_hant from '../translations/locales/zh-hant/translation.json';
import classNames from '../utils/classNames';
import getBrowserLocale from '../utils/getBrowserLocale';
import SunsetNotice from './SunsetNotice';
import { reportUiActiveMixpanelThrottled } from '../utils/reportUiActiveMixpanelThrottled';
import ScrollToTop from '../utils/ScrollToTop';
import {
    WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS,
    WALLET_LOGIN_URL,
    WALLET_SIGN_URL,
    WALLET_SEND_MONEY_URL,
} from '../utils/wallet';
import TransactionExecutorModal from '../components/transactions/ExecutorModal/TransactionExecutorModal';
import DappRequestRetired from '../components/sunset/DappRequestRetired';
import ExistingAccountGate from '../components/sunset/ExistingAccountGate';
import FeatureRetiredPage, {
    hasActiveAccount,
} from '../components/sunset/FeatureRetiredPage';
import SunsetBar from '../components/sunset/SunsetBar';
import SunsetGatedRoute from '../components/sunset/SunsetGatedRoute';
import SunsetQaChip from '../components/sunset/SunsetQaChip';
import LiquidStakingContainer from '../components/staking/liquid-staking/LiquidStakingContainer';

const { getTokenWhiteList } = tokenFiatValueActions;

const {
    handleClearUrl,
    handleRedirectUrl,
    handleRefreshUrl,
    promptTwoFactor,
    redirectTo,
    refreshAccount,
} = accountActions;

const { handleFlowLimitation } = flowLimitationActions;

const theme = {};

const PATH_PREFIX = CONFIG.PUBLIC_URL;

// TODO: https://mnw.atlassian.net/browse/MNW-98
const WEB3AUTH_FEATURE_ENABLED = true;

const Container = styled.div`
    min-height: 100vh;
    padding-bottom: 260px;
    padding-top: 75px;

    @media (max-width: 991px) {
        .App {
            .main {
                padding-bottom: 0px;
            }
        }
    }

    &.network-banner {
        @media (max-width: 450px) {
            .alert-banner,
            .lockup-avail-transfer {
                margin-top: -45px;
            }
        }
    }

    @media (max-width: 767px) {
        &.hide-footer-mobile {
            .wallet-footer {
                display: none;
            }
        }
    }
`;

class Routing extends Component {
    constructor(props) {
        super(props);

        this.pollTokenFiatValue = null;

        const languages = [
            { name: 'English', code: 'en' },
            { name: 'Italiano', code: 'it' },
            { name: 'Português', code: 'pt' },
            { name: 'Русский', code: 'ru' },
            { name: 'Tiếng Việt', code: 'vi' },
            { name: '简体中文', code: 'zh-hans' },
            { name: '繁體中文', code: 'zh-hant' },
            { name: 'Türkçe', code: 'tr' },
            { name: 'Українська', code: 'ua' },
        ];

        const browserLanguage = getBrowserLocale(languages.map((l) => l.code));

        console.log('Browser Language', browserLanguage);

        let storedLanguage = localStorage.getItem('languageCode'); // "undefined"
        if (storedLanguage === 'undefined') {
            storedLanguage = undefined;
        }

        const activeLang = storedLanguage ?? browserLanguage ?? languages[0].code;

        this.props.initialize({
            languages,
            options: {
                defaultLanguage: 'en',
                onMissingTranslation: ({ translationId, defaultTranslation }) => {
                    if (isString(defaultTranslation)) {
                        // do anything to change the defaultTranslation as you wish
                        return defaultTranslation;
                    } else {
                        // that's the code that can fix the issue
                        return ReactDOMServer.renderToStaticMarkup(defaultTranslation);
                    }
                },
                renderToStaticMarkup: ReactDOMServer.renderToStaticMarkup,
                renderInnerHtml: true,
            },
        });

        // TODO: Figure out how to load only necessary translations dynamically
        this.props.addTranslationForLanguage(translations_en, 'en');
        this.props.addTranslationForLanguage(translations_it, 'it');
        this.props.addTranslationForLanguage(translations_pt, 'pt');
        this.props.addTranslationForLanguage(translations_ru, 'ru');
        this.props.addTranslationForLanguage(translations_vi, 'vi');
        this.props.addTranslationForLanguage(translations_zh_hans, 'zh-hans');
        this.props.addTranslationForLanguage(translations_zh_hant, 'zh-hant');
        this.props.addTranslationForLanguage(translations_tr, 'tr');
        this.props.addTranslationForLanguage(translations_ua, 'ua');

        this.props.setActiveLanguage(activeLang);
        // this.addTranslationsForActiveLanguage(defaultLanguage)

        this.state = {
            openTransferPopup: false,
        };
    }

    componentDidMount = async () => {
        const {
            refreshAccount,
            handleRefreshUrl,
            history,
            handleRedirectUrl,
            handleClearUrl,
            router,
            handleClearAlert,
            handleFlowLimitation,
        } = this.props;

        handleRefreshUrl(router);
        refreshAccount();

        history.listen(async () => {
            PostHog.capturePageview();
            handleRedirectUrl(this.props.router.location);
            handleClearUrl();
            if (
                !WALLET_CREATE_NEW_ACCOUNT_FLOW_URLS.find(
                    (path) => this.props.router.location.pathname.indexOf(path) > -1
                )
            ) {
                await refreshAccount(true);
            }

            handleClearAlert();
            handleFlowLimitation();
        });
    };

    componentDidUpdate(prevProps) {
        const { activeLanguage, account } = this.props;

        if (
            prevProps.account.accountId !== account.accountId &&
            account.accountId !== undefined
        ) {
            this.props.getTokenWhiteList(account.accountId);
        }

        const prevLangCode = prevProps.activeLanguage && prevProps.activeLanguage.code;
        const curLangCode = activeLanguage && activeLanguage.code;
        const hasLanguageChanged = prevLangCode !== curLangCode;

        if (hasLanguageChanged) {
            // this.addTranslationsForActiveLanguage(curLangCode)
            localStorage.setItem('languageCode', curLangCode);
        }
    }

    handleTransferClick = () => {
        this.setState({ openTransferPopup: true });
    };

    closeTransferPopup = () => {
        this.setState({ openTransferPopup: false });
    };

    render() {
        const {
            search,
            query: { tab },
            hash,
            pathname,
        } = this.props.router.location;
        if (pathname.replace(/\/$/, '') === '/export-accounts/neardotcom/guide') {
            return (
                <ConnectedRouter basename={PATH_PREFIX} history={this.props.history}>
                    <NearDotComGuide />
                </ConnectedRouter>
            );
        }
        const { account } = this.props;
        const setTab = (nextTab) => {
            if (tab !== nextTab) {
                // Ensure any `hash` value remains in the URL when we toggle tab
                this.props.history.push({
                    search: stringify(
                        { tab: nextTab },
                        { skipNull: true, skipEmptyString: true }
                    ),
                    hash,
                });
            }
        };

        const hideFooterOnMobile = [
            WALLET_LOGIN_URL,
            WALLET_SEND_MONEY_URL,
            WALLET_SIGN_URL,
        ].includes(pathname.replace(/\//g, ''));

        const accountFound = this.props.account.localStorage?.accountFound;

        reportUiActiveMixpanelThrottled();

        return (
            <Container
                className={classNames([
                    'App',
                    {
                        'network-banner':
                            !CONFIG.IS_MAINNET || CONFIG.SHOW_PRERELEASE_WARNING,
                    },
                    { 'hide-footer-mobile': hideFooterOnMobile },
                ])}
                id='app-container'
            >
                {/*<TempEvent />*/}
                <Bootstrap />
                <Updater />
                <GlobalStyle />
                <ConnectedRouter basename={PATH_PREFIX} history={this.props.history}>
                    <ThemeProvider theme={theme}>
                        <ScrollToTop />
                        <NetworkBanner account={account} />
                        <NavigationWrapper />
                        <GlobalAlert />
                        <SunsetBar />
                        <SunsetNotice />
                        <SunsetQaChip />
                        <WalletMigration
                            open={this.state.openTransferPopup}
                            history={this.props.history}
                            onClose={this.closeTransferPopup}
                        />
                        <LedgerConfirmActionModal />
                        <ExternalRedirectModal />
                        <LedgerConnectModal />
                        <TransactionExecutorModal />
                        {account.requestPending !== null && (
                            <TwoFactorVerifyModal
                                onClose={(verified, error) => {
                                    const { account, promptTwoFactor } = this.props;
                                    Mixpanel.track('2FA Modal Verify start');
                                    // requestPending will resolve (verified == true) or reject the Promise being awaited in the method that dispatched promptTwoFactor
                                    account.requestPending(verified, error);
                                    // clears requestPending and closes the modal
                                    promptTwoFactor(null);
                                    if (error) {
                                        // tracking error
                                        Mixpanel.track('2FA Modal Verify fail', {
                                            error: error.message,
                                        });
                                    }
                                    if (verified) {
                                        Mixpanel.track('2FA Modal Verify finish');
                                    }
                                }}
                            />
                        )}
                        <Switch>
                            <Redirect
                                from='//*'
                                to={{
                                    pathname: '/*',
                                    search: search,
                                }}
                            />
                            <GuestLandingRoute
                                exact
                                path='/'
                                render={(props) => (
                                    <WalletWrapper tab={tab} setTab={setTab} {...props} />
                                )}
                                accountFound={accountFound}
                                indexBySearchEngines={!accountFound}
                            />
                            <Route
                                exact
                                path={'/set-password'}
                                render={() => (
                                    <SetPasswordPage
                                        uponSetPassword={() => {
                                            // this.props.history.push('/');
                                        }}
                                    />
                                )}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/change-password'
                                component={ChangePasswordPage}
                            />
                            <SunsetGatedRoute
                                capability='linkdropClaim'
                                exact
                                path='/linkdrop/:fundingContract/:fundingKey'
                                component={LinkdropLandingWithRouter}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/create/:fundingContract/:fundingKey'
                                component={CreateAccountWithRouter}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/create'
                                render={(props) =>
                                    accountFound || !CONFIG.DISABLE_CREATE_ACCOUNT ? (
                                        <CreateAccountWithRouter {...props} />
                                    ) : (
                                        <CreateAccountLanding />
                                    )
                                }
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path={'/create-from/:fundingAccountId'}
                                component={CreateAccountWithRouter}
                            />
                            {/*
                              These routes also serve new accounts, which the createAccount gates
                              below handle. Once adding keys and Ledger devices is retired as well,
                              they are retired for every account, so answer them first.
                            */}
                            {!isSunsetCapabilityEnabled('addRecoveryMethod') && (
                                <Route
                                    exact
                                    path={[
                                        '/set-recovery/:accountId/:fundingContract?/:fundingKey?',
                                        '/setup-seed-phrase/:accountId/:step',
                                    ]}
                                    render={({ match }) => (
                                        <FeatureRetiredPage
                                            capability='addRecoveryMethod'
                                            route={match.path}
                                        />
                                    )}
                                />
                            )}
                            {!isSunsetCapabilityEnabled('manageLedger') && (
                                <Route
                                    exact
                                    path='/setup-ledger/:accountId'
                                    render={({ match }) => (
                                        <FeatureRetiredPage
                                            capability='manageLedger'
                                            route={match.path}
                                        />
                                    )}
                                />
                            )}
                            <SunsetGatedRoute
                                capability='createAccount'
                                retireIf={() => !hasActiveAccount()}
                                guard={PasswordProtectedRoute}
                                exact
                                path='/set-recovery/:accountId/:fundingContract?/:fundingKey?'
                                render={(props) => (
                                    <ExistingAccountGate
                                        accountId={props.match.params.accountId}
                                        fundingContract={
                                            props.match.params.fundingContract
                                        }
                                        route='/set-recovery/:accountId'
                                    >
                                        <SetupRecoveryMethodWithRouter {...props} />
                                    </ExistingAccountGate>
                                )}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PublicRoute}
                                exact
                                path='/set-recovery-implicit-account'
                                component={SetupRecoveryImplicitAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PublicRoute}
                                exact
                                path='/setup-passphrase-new-account'
                                component={SetupPassphraseNewAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PublicRoute}
                                exact
                                path='/setup-ledger-new-account'
                                component={SetupLedgerNewAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PublicRoute}
                                exact
                                path='/create-implicit-account'
                                component={CreateImplicitAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                retireIf={() => !hasActiveAccount()}
                                guard={PasswordProtectedRoute}
                                exact
                                path='/setup-seed-phrase/:accountId/:step'
                                render={(props) => (
                                    <ExistingAccountGate
                                        accountId={props.match.params.accountId}
                                        route='/setup-seed-phrase/:accountId/:step'
                                    >
                                        <SetupSeedPhraseWithRouter {...props} />
                                    </ExistingAccountGate>
                                )}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/verify-account'
                                component={VerifyAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/initial-deposit'
                                component={InitialDepositWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/fund-with-existing-account'
                                component={ExistingAccountWrapper}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/fund-create-account/:accountId/:implicitAccountId/:recoveryMethod'
                                component={SetupImplicitWithRouter}
                            />
                            <SunsetGatedRoute
                                capability='createAccount'
                                retireIf={() => !hasActiveAccount()}
                                guard={PasswordProtectedRoute}
                                exact
                                path='/setup-ledger/:accountId'
                                render={(props) => (
                                    <ExistingAccountGate
                                        accountId={props.match.params.accountId}
                                        route='/setup-ledger/:accountId'
                                    >
                                        <SetupLedgerWithRouter {...props} />
                                    </ExistingAccountGate>
                                )}
                            />
                            <SunsetGatedRoute
                                capability='manageLedger'
                                guard={PrivateRoute}
                                exact
                                path='/setup-ledger-success'
                                component={SetupLedgerSuccessWithRouter}
                            />
                            <SunsetGatedRoute
                                capability='enableTwoFactor'
                                guard={PrivateRoute}
                                exact
                                path='/enable-two-factor'
                                component={EnableTwoFactor}
                            />
                            <PasswordProtectedRoute
                                path='/recover-account'
                                component={RecoverAccountWrapper}
                                indexBySearchEngines={true}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/recover-seed-phrase/:accountId?/:seedPhrase?'
                                component={RecoverAccountSeedPhraseWithRouter}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/recover-with-link/:accountId/:seedPhrase'
                                component={ImportAccountWithLinkWrapper}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/recover-private-key'
                                component={RecoverAccountPrivateKey}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/auto-import-seed-phrase'
                                render={({ location }) => {
                                    const importString = decodeURIComponent(
                                        location.hash.substring(1)
                                    );
                                    const hasAccountId = importString.includes('/');
                                    const seedPhrase = hasAccountId
                                        ? importString.split('/')[1]
                                        : importString;
                                    const { secretKey } = parseSeedPhrase(seedPhrase);
                                    return (
                                        <AutoImportWrapper
                                            secretKey={secretKey}
                                            accountId={
                                                hasAccountId
                                                    ? importString.split('/')[0]
                                                    : null
                                            }
                                            mixpanelImportType='seed phrase'
                                        />
                                    );
                                }}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/auto-import-secret-key'
                                render={({ location }) => {
                                    const importString = decodeURIComponent(
                                        location.hash.substring(1)
                                    );
                                    const hasAccountId = importString.includes('/');
                                    return (
                                        <AutoImportWrapper
                                            secretKey={
                                                hasAccountId
                                                    ? importString.split('/')[1]
                                                    : importString
                                            }
                                            accountId={
                                                hasAccountId
                                                    ? importString.split('/')[0]
                                                    : null
                                            }
                                            mixpanelImportType='secret key'
                                        />
                                    );
                                }}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/batch-import'
                                render={() => (
                                    <BatchImportAccounts
                                        onCancel={() => this.props.history.replace('/')}
                                    />
                                )}
                            />
                            <SunsetGatedRoute
                                capability='manageLedger'
                                guard={PasswordProtectedRoute}
                                exact
                                path='/batch-ledger-export'
                                component={BatchLedgerExport}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/select'
                                component={AccountExportSelect}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/success'
                                component={AccountExportSuccess}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/remove'
                                component={AccountExportRemove}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/method'
                                component={AccountExportMethod}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/new-key-start'
                                component={AccountExportNewKeyStart}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/new-key-activation'
                                component={AccountExportNewKeyActivation}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/new-key-activated'
                                component={AccountExportNewKeyActivated}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/new-key-recovery'
                                component={AccountExportNewKeyRecovery}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/export-accounts/manual'
                                component={AccountExportManual}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/sign-in-ledger'
                                component={SignInLedgerWrapper}
                            />
                            {/* Not exact: near-api-js opens `/login/`. */}
                            <SunsetGatedRoute
                                capability='dappConnect'
                                guard={PrivateRoute}
                                path='/login'
                                component={LoginWrapper}
                                retired={() => <DappRequestRetired kind='login' />}
                            />
                            <PrivateRoute
                                exact
                                path='/authorized-apps'
                                render={() => (
                                    <AccessKeysWrapper type='authorized-apps' />
                                )}
                            />
                            <PrivateRoute
                                exact
                                path='/full-access-keys'
                                render={() => (
                                    <AccessKeysWrapper type='full-access-keys' />
                                )}
                            />
                            <SunsetGatedRoute
                                capability='send'
                                guard={PrivateRoute}
                                exact
                                path='/send-money/:accountId?'
                                component={SendContainerWrapper}
                            />
                            <PrivateRoute
                                exact
                                path='/nft-detail/:contractId/:tokenId'
                                component={NFTDetailWrapper}
                            />
                            <SunsetGatedRoute
                                capability='receive'
                                guard={PrivateRoute}
                                exact
                                path='/receive-money'
                                component={ReceiveContainerWrapper}
                            />
                            <SunsetGatedRoute
                                capability='buy'
                                guard={PrivateRoute}
                                exact
                                path='/buy'
                                component={BuyNear}
                            />
                            <SunsetGatedRoute
                                capability='swap'
                                guard={PrivateRoute}
                                exact
                                path='/swap'
                                component={TokenSwap}
                            />
                            <PasswordProtectedRoute
                                exact
                                path='/profile/:accountId'
                                component={Profile}
                            />
                            <PrivateRoute
                                exact
                                path='/profile/:accountId?'
                                component={Profile}
                            />
                            {/*
                              Until Phase 3, signing stays open to signed-in users. A browser with
                              no account would be sent to the guest landing, which no longer offers
                              import, and the app would wait forever: answer it instead.
                            */}
                            <SunsetGatedRoute
                                capability='dappConnect'
                                retireIf={() =>
                                    !isSunsetCapabilityEnabled('dappSign') ||
                                    !hasActiveAccount()
                                }
                                guard={PrivateRoute}
                                exact
                                path='/sign'
                                component={SignWrapper}
                                retired={() => <DappRequestRetired kind='sign' />}
                            />
                            <PrivateRoute
                                path='/staking'
                                render={() => (
                                    <StakingContainer history={this.props.history} />
                                )}
                            />
                            <PrivateRoute
                                path='/liquid-staking'
                                render={() => <LiquidStakingContainer />}
                            />
                            <PrivateRoute
                                exact
                                path='/transaction-history'
                                component={TransactionHistory}
                            />
                            <SunsetGatedRoute
                                capability='explore'
                                guard={PrivateRoute}
                                exact
                                path='/explore'
                                component={ExploreContainer}
                            />
                            <Route exact path='/connection' component={Connection} />
                            <Route
                                exact
                                path='/cli-login-success'
                                component={LoginCliLoginSuccess}
                            />
                            <Route
                                exact
                                path='/terms'
                                component={Terms}
                                indexBySearchEngines={true}
                            />
                            <Route
                                exact
                                path='/privacy'
                                component={Privacy}
                                indexBySearchEngines={true}
                            />
                            <SunsetGatedRoute
                                capability='dappConnect'
                                retireIf={() =>
                                    !isSunsetCapabilityEnabled('dappSignMessage') ||
                                    !hasActiveAccount()
                                }
                                guard={PrivateRoute}
                                exact
                                path='/sign-message'
                                component={SignMessageWrapper}
                                retired={() => <DappRequestRetired kind='signMessage' />}
                            />
                            {WEB3AUTH_FEATURE_ENABLED && (
                                <SunsetGatedRoute
                                    capability='dappConnect'
                                    retireIf={() =>
                                        !isSunsetCapabilityEnabled('dappSignMessage') ||
                                        !hasActiveAccount()
                                    }
                                    guard={PrivateRoute}
                                    exact
                                    path='/verify-owner'
                                    component={VerifyOwnerWrapper}
                                    retired={() => (
                                        <DappRequestRetired kind='verifyOwner' />
                                    )}
                                />
                            )}
                            <PrivateRoute component={PageNotFound} />
                        </Switch>
                        <Footer />
                    </ThemeProvider>
                </ConnectedRouter>
            </Container>
        );
    }
}

Routing.propTypes = {
    history: PropTypes.object.isRequired,
};

const mapDispatchToProps = {
    refreshAccount,
    handleRefreshUrl,
    handleRedirectUrl,
    handleClearUrl,
    promptTwoFactor,
    redirectTo,
    handleClearAlert,
    handleFlowLimitation,
    getTokenWhiteList,
};

const mapStateToProps = (state) => ({
    account: selectAccountSlice(state),
    router: getRouter(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(Routing));
