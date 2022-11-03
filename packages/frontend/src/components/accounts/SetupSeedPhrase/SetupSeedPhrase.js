import { KeyPair } from 'near-api-js';
import { generateSeedPhrase } from 'near-seed-phrase';
import React, { Component, Fragment } from 'react';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';
import { withRouter, Route } from 'react-router-dom';

import { Mixpanel } from '../../../mixpanel/index';
import {
    handleAddAccessKeySeedPhrase,
    refreshAccount,
    checkIsNew,
    handleCreateAccountWithSeedPhrase,
    fundCreateAccount
} from '../../../redux/actions/account';
import { clearGlobalAlert, showCustomAlert } from '../../../redux/actions/status';
import { setAuthorizedByPassword } from '../../../redux/reducers/security';
import { selectAccountSlice } from '../../../redux/slices/account';
import { actions as linkdropActions } from '../../../redux/slices/linkdrop';
import {
    actions as recoveryMethodsActions,
    selectRecoveryMethodsByAccountId,
    selectRecoveryMethodsLoading
} from '../../../redux/slices/recoveryMethods';
import { selectStatusMainLoader } from '../../../redux/slices/status';
import copyText from '../../../utils/copyText';
import { isEncrypted } from '../../../utils/encryption/keys';
import isMobile from '../../../utils/isMobile';
import parseFundingOptions from '../../../utils/parseFundingOptions';
import { Snackbar, snackbarDuration } from '../../common/Snackbar';
import Container from '../../common/styled/Container.css';
import { isRetryableRecaptchaError } from '../../Recaptcha';
import SetPasswordForm from '../SetPasswordForm';
import SetupSeedPhraseForm from '../SetupSeedPhraseForm';
import SetupSeedPhraseVerify from '../SetupSeedPhraseVerify';
import { encryptWallet } from './lib/encryption';
import { Title, Description, Back } from './ui';
import BackButton from './ui/BackButton';

const { setLinkdropAmount } = linkdropActions;
const { fetchRecoveryMethods } = recoveryMethodsActions;

// FIXME: Use `debug` npm package so we can keep some debug logging around but not spam the console everywhere
const ENABLE_DEBUG_LOGGING = false;

const debugLog = (...args) => ENABLE_DEBUG_LOGGING && console.log('SetupSeedPhrase:', ...args);

class SetupSeedPhrase extends Component {
    recaptchaRef = null

    state = {
        seedPhrase: '',
        enterWord: '',
        wordId: null,
        localAlert: null,
        successSnackbar: false,
        submitting: false,
        recaptchaToken: null,
        isNewAccount: false,
        password: null
    }

    componentDidMount = async () => {
        this.refreshData();
    }

    refreshData = async () => {
        const { accountId, fetchRecoveryMethods, checkIsNew } = this.props;
        const { seedPhrase, publicKey, secretKey } = generateSeedPhrase();
        const recoveryKeyPair = KeyPair.fromString(secretKey);
        const wordId = Math.floor(Math.random() * 12);

        const isNewAccount = await checkIsNew(accountId);

        if (!isNewAccount) {
            fetchRecoveryMethods({ accountId });
        }

        this.setState((prevState) => ({
            ...prevState,
            seedPhrase,
            publicKey,
            wordId,
            enterWord: '',
            localAlert: null,
            recoveryKeyPair,
            isNewAccount
        }));
    }

    handlePhraseContinue = () => {
        const { history, accountId, location } = this.props;
        history.push(`/setup-seed-phrase/${accountId}/verify${location.search}`);
    }

    handlePhraseCancel = () => {
        const { history, accountId, location } = this.props;
        const { isNewAccount} = this.state;

        if (isNewAccount) {
            history.push(`/set-recovery/${accountId}${location.search}`);
        } else {
            history.push('/profile');
        }
    }

    handleChangeWord = (value) => {
        if (value.match(/[^a-zA-Z]/)) {
            return false;
        }

        this.setState(() => ({
            enterWord: value.trim().toLowerCase(),
            localAlert: null
        }));
    }

    handleStartOver = () => {
        const {
            history,
            location,
            accountId,
        } = this.props;

        this.refreshData();
        history.push(`/setup-seed-phrase/${accountId}/phrase${location.search}`);
    }

    handleVerifyPhrase = () => {
        const { seedPhrase, enterWord, wordId } = this.state;
        Mixpanel.track('SR-SP Verify start');

        if (enterWord !== seedPhrase.split(' ')[wordId]) {
            this.setState(() => ({
                localAlert: {
                    success: false,
                    messageCode: 'account.verifySeedPhrase.error',
                    show: true
                }
            }));
            Mixpanel.track('SR-SP Verify fail', { error: 'word is not matched the phrase' });
            return false;
        }

        Mixpanel.track('SR-SP Verify finish');

        const shouldSkipPasswordStep = isEncrypted();
        // Cause password already set
        if (shouldSkipPasswordStep) {
            this.setState({
                submitting: true,
            }, this.handleSetupSeedPhrase);

            return ;
        }

        this.props.history.push(`/setup-seed-phrase/${this.props.accountId}/set-encryption`);
    }

    handleSubmitPasswordStep = (password) => {
        this.setState({
            submitting: true,
            password,
        }, this.handleSetupSeedPhrase);
    }

    handleSetupSeedPhrase = async () => {
        debugLog('handleSetupSeedPhrase()');
        const {
            accountId,
            handleAddAccessKeySeedPhrase,
            handleCreateAccountWithSeedPhrase,
            fundCreateAccount,
            showCustomAlert,
            location,
            setLinkdropAmount
        } = this.props;
        const { recoveryKeyPair, recaptchaToken, password } = this.state;

        if (!this.state.isNewAccount) {
            debugLog('handleSetupSeedPhrase()/existing account');

            await Mixpanel.withTracking('SR-SP Setup for existing account',
                async () => await handleAddAccessKeySeedPhrase(accountId, recoveryKeyPair)
            );

            return;
        }

        const fundingOptions = parseFundingOptions(location.search);

        await Mixpanel.withTracking('SR-SP Setup for new account',
            async () => {
                if (password !== null) {
                    await encryptWallet(password);
                    this.props.setAuthorizedByPassword(true);
                }

                await handleCreateAccountWithSeedPhrase(
                    accountId,
                    recoveryKeyPair,
                    fundingOptions,
                    recaptchaToken
                );

                if (fundingOptions?.fundingAmount) {
                    setLinkdropAmount(fundingOptions.fundingAmount);
                }
            },
            async (err) => {
                debugLog('failed to create account!', err);

                this.setState({ submitting: false });

                if (isRetryableRecaptchaError(err)) {
                    Mixpanel.track('Funded account creation failed due to invalid / expired reCaptcha response from user');
                    this.recaptchaRef.reset();
                    showCustomAlert({
                        success: false,
                        messageCodeHeader: 'error',
                        messageCode: 'walletErrorCodes.invalidRecaptchaCode',
                        errorMessage: err.message
                    });
                } else if (err.code === 'NotEnoughBalance') {
                    Mixpanel.track('SR-SP NotEnoughBalance creating funded account');
                    await fundCreateAccount(accountId, recoveryKeyPair, 'phrase');
                } else {
                    showCustomAlert({
                        errorMessage: err.message,
                        success: false,
                        messageCodeHeader: 'error'
                    });
                }
            }
        );
    }

    handleCopyPhrase = () => {
        Mixpanel.track('SR-SP Copy seed phrase');
        if (navigator.share && isMobile()) {
            navigator.share({
                text: this.state.seedPhrase
            }).catch((err) => {
                debugLog(err.message);
            });
        } else {
            this.handleCopyDesktop();
        }
    }

    handleCopyDesktop = () => {
        copyText(document.getElementById('seed-phrase'));
        this.setState({ successSnackbar: true }, () => {
            setTimeout(() => {
                this.setState({ successSnackbar: false });
            }, snackbarDuration);
        });
    }

    handleRecaptchaChange = (recaptchaToken) => {
        debugLog('handleRecaptchaChange()', recaptchaToken);
        this.setState({ recaptchaToken });
    }

    handleOnSubmit = (e) => {
        e.preventDefault();
        this.handleVerifyPhrase();
    }

    render() {
        const { recoveryMethods, recoveryMethodsLoader } = this.props;
        const hasSeedPhraseRecovery = recoveryMethodsLoader || recoveryMethods.filter((m) =>
            m.kind === 'phrase').length > 0;
        const {
            seedPhrase,
            enterWord,
            wordId,
            submitting,
            localAlert,
            isNewAccount,
            successSnackbar
        } = this.state;

        return (
            <Fragment>
                <Route
                    exact
                    path={'/setup-seed-phrase/:accountId/phrase'}
                    render={() => (
                        <Container className='small-centered border'>
                            <h1><Trans i18nKey='setupSeedPhrase.pageTitle'/></h1>
                            <h2>
                                <Trans i18nKey='setupSeedPhrase.pageText'>
                                    <b>
                                        Anyone with access to it will also have access to your account!
                                    </b>
                                </Trans>
                            </h2>
                            <SetupSeedPhraseForm
                                seedPhrase={seedPhrase}
                                handleCopyPhrase={this.handleCopyPhrase}
                                hasSeedPhraseRecovery={hasSeedPhraseRecovery}
                                refreshData={this.refreshData}
                                onClickContinue={this.handlePhraseContinue}
                                onClickCancel={this.handlePhraseCancel}
                            />
                        </Container>
                    )}
                />
                <Route
                    exact
                    path={'/setup-seed-phrase/:accountId/verify'}
                    render={() => (
                        <Container className='small-centered border'>
                            <form
                                onSubmit={this.handleOnSubmit}
                                autoComplete='off'
                            >
                                <Title>
                                    <Back>
                                        <BackButton onBack={this.handleStartOver} />
                                    </Back>
                                    <h1><Trans i18nKey='setupSeedPhraseVerify.pageTitle' /></h1>
                                </Title>
                                <Description><Trans i18nKey='setupSeedPhraseVerify.pageText' /></Description>
                                <SetupSeedPhraseVerify
                                    enterWord={enterWord}
                                    wordId={wordId}
                                    handleChangeWord={this.handleChangeWord}
                                    mainLoader={this.props.mainLoader || submitting}
                                    localAlert={localAlert}
                                    globalAlert={this.props.globalAlert}
                                    onRecaptchaChange={this.handleRecaptchaChange}
                                    ref={(ref) => this.recaptchaRef = ref}
                                    isNewAccount={isNewAccount}
                                    onSubmit={this.handleOnSubmit}
                                    isLinkDrop={parseFundingOptions(this.props.location.search) !== null}
                                    hasSeedPhraseRecovery={hasSeedPhraseRecovery}
                                />
                            </form>
                        </Container>
                    )}
                />
                <Route
                    path={'/setup-seed-phrase/:accountId/set-encryption'}
                    render={() => (
                        <Container className='small-centered border'>
                            <form autoComplete='off'>
                                <Title>
                                    <Back>
                                        <BackButton onBack={this.handleStartOver} />
                                    </Back>
                                    <h1><Trans i18nKey='setupPasswordProtection.pageTitle' /></h1>
                                </Title>
                                <Description>
                                    <Trans i18nKey='setupPasswordProtection.pageText' />
                                </Description>
                                <SetPasswordForm
                                    loading={this.props.mainLoader || submitting}
                                    onSubmit={this.handleSubmitPasswordStep} />
                            </form>
                        </Container>
                    )}
                />
                <Snackbar
                    theme='success'
                    message={<Trans i18nKey='setupSeedPhrase.snackbarCopySuccess' />}
                    show={successSnackbar}
                    onHide={() => this.setState({ successSnackbar: false })}
                />
            </Fragment>
        );
    }
}

const mapDispatchToProps = {
    clearGlobalAlert,
    handleAddAccessKeySeedPhrase,
    refreshAccount,
    checkIsNew,
    handleCreateAccountWithSeedPhrase,
    fundCreateAccount,
    fetchRecoveryMethods,
    showCustomAlert,
    setLinkdropAmount,
    setAuthorizedByPassword,
};

const mapStateToProps = (state, { match }) => {
    const { accountId } = match.params;

    return {
        ...selectAccountSlice(state),
        accountId,
        recoveryMethods: selectRecoveryMethodsByAccountId(state, { accountId }),
        mainLoader: selectStatusMainLoader(state),
        recoveryMethodsLoader: selectRecoveryMethodsLoading(state, { accountId })
    };
};

const SetupSeedPhraseWithRouter = connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(SetupSeedPhrase));

export default SetupSeedPhraseWithRouter;
