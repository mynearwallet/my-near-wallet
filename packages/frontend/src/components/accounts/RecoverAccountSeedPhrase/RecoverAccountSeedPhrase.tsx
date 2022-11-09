import { getRouter } from 'connected-react-router';
import { parse as parseQuery, stringify } from 'query-string';
import React, { Component } from 'react';
import { Translate } from 'react-localize-redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { Mixpanel } from '../../../mixpanel';
import {
    recoverAccountSeedPhrase,
    redirectToApp,
    redirectTo,
    refreshAccount,
    clearAccountState
} from '../../../redux/actions/account';
import {
    clearLocalAlert,
    showCustomAlert,
    clearGlobalAlert
} from '../../../redux/actions/status';
import {
    actions as importZeroBalanceAccountActions
} from '../../../redux/slices/importZeroBalanceAccount';
import {
    importZeroBalanceAccountPhrase
} from '../../../redux/slices/importZeroBalanceAccount/importAccountThunks';
import {selectActionsPending, selectStatusLocalAlert } from '../../../redux/slices/status';
import isValidSeedPhrase from '../../../utils/isValidSeedPhrase';
import parseFundingOptions from '../../../utils/parseFundingOptions';
import RecoverAccountSeedPhraseForm from '../RecoverAccountSeedPhraseForm';
import { StyledContainer } from './ui';

const { setZeroBalanceAccountImportMethod } = importZeroBalanceAccountActions;


type RecoverAccountSeedPhraseProps = {
    location: ReturnType<typeof getRouter>['location'];
    seedPhrase: string;
    localAlert: ReturnType<typeof selectStatusLocalAlert>,
    findMyAccountSending: boolean;
}

type RecoverAccountSeedPhraseActions = {
    recoverAccountSeedPhrase: typeof recoverAccountSeedPhrase;
    redirectTo: typeof redirectTo;
    redirectToApp: typeof redirectToApp;
    refreshAccount: typeof refreshAccount;
    clearLocalAlert: typeof clearLocalAlert;
    clearAccountState: typeof clearAccountState;
    showCustomAlert: typeof showCustomAlert;
    importZeroBalanceAccountPhrase: typeof importZeroBalanceAccountPhrase;
    setZeroBalanceAccountImportMethod: typeof setZeroBalanceAccountImportMethod;
}

type RecoverAccountSeedPhraseState = {
    seedPhrase: string;
    recoveringAccount: boolean;
}

class RecoverAccountSeedPhrase extends Component<
    RecoverAccountSeedPhraseProps &
    RecoverAccountSeedPhraseActions,
    RecoverAccountSeedPhraseState
> {
    state = {
        seedPhrase: this.props.seedPhrase,
        recoveringAccount: false,
    }

    validators = {
        seedPhrase: (value: string): boolean => !!value.length
    }

    get isLegit(): boolean {
        return Object.keys(this.validators).every((field) =>
            this.validators[field](this.state[field]));
    }

    handleChange = (value: string): void => {
        this.setState(() => ({
            seedPhrase: value
        }));

        this.props.clearLocalAlert();
    }

    handleSubmit = async (): Promise<boolean> => {
        if (!this.isLegit) {
            Mixpanel.track('IE-SP Recover seed phrase link not valid');

            return false;
        }

        const { seedPhrase } = this.state;
        const {
            location,
            redirectTo,
            redirectToApp,
            clearAccountState,
            recoverAccountSeedPhrase,
            refreshAccount,
            showCustomAlert,
            importZeroBalanceAccountPhrase,
            setZeroBalanceAccountImportMethod
        } = this.props;

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

        await Mixpanel.withTracking('IE-SP Recovery with seed phrase',
            async () => {
                this.setState({ recoveringAccount: true });
                await recoverAccountSeedPhrase(seedPhrase);
                await refreshAccount();
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

        const fundWithExistingAccount = parseQuery(
            location.search, { parseBooleans: true }
        ).fundWithExistingAccount;

        if (fundWithExistingAccount) {
            const createNewAccountParams = stringify(
                JSON.parse(fundWithExistingAccount.toString())
            );

            redirectTo(`/fund-with-existing-account?${createNewAccountParams}`);
        } else {
            const options = parseFundingOptions(location.search);
            if (options) {
                const query = parseQuery(location.search);
                const redirectUrl = query.redirectUrl ?
                    `?redirectUrl=${encodeURIComponent(query.redirectUrl.toString())}` : '';

                redirectTo(`/linkdrop/${options.fundingContract}/${options.fundingKey}${redirectUrl}`);
            } else {
                redirectToApp('/');
            }
        }
        clearAccountState();
    }

    render() {
        const isLegit = this.isLegit &&
            !(this.props.localAlert && this.props.localAlert.success === false);

        return (
            <StyledContainer className='small-centered border'>
                <h1><Translate id='recoverSeedPhrase.pageTitle' /></h1>
                <h2><Translate id='recoverSeedPhrase.pageText' /></h2>
                <form onSubmit={(e) => {
                    this.handleSubmit();
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
            </StyledContainer>
        );
    }
}

const mapDispatchToProps = {
    recoverAccountSeedPhrase,
    redirectTo,
    redirectToApp,
    refreshAccount,
    clearLocalAlert,
    clearAccountState,
    showCustomAlert,
    importZeroBalanceAccountPhrase,
    setZeroBalanceAccountImportMethod
};

const mapStateToProps = (state, { match }) => ({
    router: getRouter(state),
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
