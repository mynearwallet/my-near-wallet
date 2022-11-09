import React, { Component } from 'react';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';
import { withRouter, Route } from 'react-router-dom';


import { Mixpanel } from '../../../mixpanel';
import {
    recoverAccountSeedPhrase,
    redirectToApp,
    refreshAccount,
    clearAccountState
} from '../../../redux/actions/account';
import {
    clearLocalAlert,
    showCustomAlert,
    clearGlobalAlert
} from '../../../redux/actions/status';
import { setAuthorizedByPassword } from '../../../redux/reducers/security';
import {
    actions as importZeroBalanceAccountActions
} from '../../../redux/slices/importZeroBalanceAccount';
import {
    importZeroBalanceAccountPhrase
} from '../../../redux/slices/importZeroBalanceAccount/importAccountThunks';
import { selectActionsPending, selectStatusLocalAlert } from '../../../redux/slices/status';
import { encryptWallet } from '../../../utils/encryption';
import { isValidSeedPhrase } from '../../../utils/seed-phrase';
import RecoverAccountSeedPhraseForm from '../RecoverAccountSeedPhraseForm';
import SetPasswordForm from '../SetPasswordForm';
import { Back, Description, Title } from '../SetupSeedPhrase/ui';
import BackButton from '../SetupSeedPhrase/ui/BackButton';
import { StyledContainer } from './ui';

const { setZeroBalanceAccountImportMethod } = importZeroBalanceAccountActions;


type RecoverAccountSeedPhraseProps = {
    seedPhrase: string;
    localAlert: ReturnType<typeof selectStatusLocalAlert>,
    findMyAccountSending: boolean;
}

type RecoverAccountSeedPhraseActions = {
    recoverAccountSeedPhrase: typeof recoverAccountSeedPhrase;
    redirectToApp: typeof redirectToApp;
    refreshAccount: typeof refreshAccount;
    clearLocalAlert: typeof clearLocalAlert;
    clearAccountState: typeof clearAccountState;
    showCustomAlert: typeof showCustomAlert;
    importZeroBalanceAccountPhrase: typeof importZeroBalanceAccountPhrase;
    setZeroBalanceAccountImportMethod: typeof setZeroBalanceAccountImportMethod;
    setAuthorizedByPassword: typeof setAuthorizedByPassword;
}

type RecoverAccountSeedPhraseState = {
    seedPhrase: string;
    recoveringAccount: boolean;
    password: string|null;
}

class RecoverAccountSeedPhrase extends Component<
    RecoverAccountSeedPhraseProps &
    RecoverAccountSeedPhraseActions,
    RecoverAccountSeedPhraseState
> {
    state = {
        seedPhrase: this.props.seedPhrase,
        recoveringAccount: false,
        password: null,
    }

    validators = {
        seedPhrase: (value: string): boolean => !!value.length
    }

    get isLegit(): boolean {
        return Object.keys(this.validators).every((field) =>
            this.validators[field](this.state[field]));
    }

    handleChange = (value: string): void => {
        this.setState({ seedPhrase: value });

        this.props.clearLocalAlert();
    }

    handleSubmitSeedPhrase = (): void => {
        if (!this.isLegit) {
            Mixpanel.track('IE-SP Recover seed phrase link not valid');

            return;
        }

        const { seedPhrase } = this.state;
        const { showCustomAlert } = this.props;

        try {
            isValidSeedPhrase(seedPhrase);
        } catch (e) {
            showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                messageCode: 'walletErrorCodes.recoverAccountSeedPhrase.errorSeedPhraseNotValid',
                errorMessage: e.message
            });

            return;
        }

        // @ts-ignore RouteComponentProps doesnt work
        this.props.history.push('/recover-seed-phrase/set-encryption');
    }

    handleStartOver = (): void => {
        // @ts-ignore RouteComponentProps doesnt work
        this.props.history.push('/recover-seed-phrase');
    }

    handleSubmitPasswordStep = (password: string): void => {
        this.setState({ password }, this.handleSetup);
    }

    handleSetup = async (): Promise<void> => {
        const { seedPhrase } = this.state;

        const {
            redirectToApp,
            clearAccountState,
            recoverAccountSeedPhrase,
            refreshAccount,
            importZeroBalanceAccountPhrase,
            setZeroBalanceAccountImportMethod
        } = this.props;

        await Mixpanel.withTracking('IE-SP Recovery with seed phrase',
            async () => {
                if (this.state.password !== null) {
                    await encryptWallet(this.state.password);
                    this.props.setAuthorizedByPassword(true);
                }

                this.setState({ recoveringAccount: true });
                await recoverAccountSeedPhrase(seedPhrase);
                await refreshAccount();
                redirectToApp();
            }, async (e) => {
                if (e.message.includes('Cannot find matching public key')) {
                    // @ts-ignore createAsyncThunk isn't typed
                    await importZeroBalanceAccountPhrase(seedPhrase);
                    setZeroBalanceAccountImportMethod('phrase');
                    clearGlobalAlert();
                    redirectToApp();
                }

                throw e;
            }, () => {
                this.setState({ recoveringAccount: false });
            }
        );

        clearAccountState();
    }

    render() {
        const isLegit = this.isLegit &&
            !(this.props.localAlert && this.props.localAlert.success === false);

        return (
            <StyledContainer className='small-centered border'>
                <Route
                    exact
                    path={'/recover-seed-phrase'}
                    render={() => (
                        <>
                            <h1><Trans i18nKey='recoverSeedPhrase.pageTitle' /></h1>
                            <h2><Trans i18nKey='recoverSeedPhrase.pageText' /></h2>
                            <form onSubmit={(e) => {
                                this.handleSubmitSeedPhrase();
                                e.preventDefault();
                            }} autoComplete='off'>
                                <RecoverAccountSeedPhraseForm
                                    seedPhrase={this.state.seedPhrase}
                                    localAlert={this.props.localAlert}
                                    recoveringAccount={this.state.recoveringAccount}
                                    findMyAccountSending={this.props.findMyAccountSending}
                                    isLegit={isLegit}
                                    handleChange={this.handleChange}
                                />
                            </form>
                        </>
                    )}
                />

                <Route
                    exact
                    path={'/recover-seed-phrase/set-encryption'}
                    render={() => (
                        <>
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
                                    loading={this.state.recoveringAccount}
                                    onSubmit={this.handleSubmitPasswordStep} />
                            </form>
                        </>
                    )}
                />
            </StyledContainer>
        );
    }
}

const mapDispatchToProps = {
    recoverAccountSeedPhrase,
    redirectToApp,
    refreshAccount,
    clearLocalAlert,
    clearAccountState,
    showCustomAlert,
    importZeroBalanceAccountPhrase,
    setZeroBalanceAccountImportMethod,
    setAuthorizedByPassword
};

const mapStateToProps = (state, { match }) => ({
    seedPhrase: match.params.seedPhrase || '',
    localAlert: selectStatusLocalAlert(state),
    // @ts-ignore
    findMyAccountSending: selectActionsPending(state, {
        types: ['RECOVER_ACCOUNT_SEED_PHRASE', 'REFRESH_ACCOUNT_OWNER']
    })
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(RecoverAccountSeedPhrase));
