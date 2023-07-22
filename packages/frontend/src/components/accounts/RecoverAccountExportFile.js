import { getRouter } from 'connected-react-router';
import React, { Component } from 'react';
import { Translate } from 'react-localize-redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';

import { Mixpanel } from '../../mixpanel/index';
import {
    recoverAccountExportFile,
    redirectToApp,
    redirectTo,
    refreshAccount,
    clearAccountState,
} from '../../redux/actions/account';
import {
    clearLocalAlert,
    showCustomAlert,
    clearGlobalAlert,
} from '../../redux/actions/status';
import { selectAccountSlice } from '../../redux/slices/account';
import { actions as importZeroBalanceAccountActions } from '../../redux/slices/importZeroBalanceAccount';
import { importZeroBalanceAccountPhrase } from '../../redux/slices/importZeroBalanceAccount/importAccountThunks';
import {
    selectActionsPending,
    selectStatusLocalAlert,
    selectStatusMainLoader,
} from '../../redux/slices/status';
import Container from '../common/styled/Container.css';
import RecoverAccountExportFileForm from './RecoverAccountExportFileForm';

const { setZeroBalanceAccountImportMethod } = importZeroBalanceAccountActions;

const StyledContainer = styled(Container)`
    .input {
        width: 100%;
    }

    .input-sub-label {
        margin-bottom: 30px;
    }

    h4 {
        :first-of-type {
            margin: 30px 0 0 0 !important;
        }
    }

    button {
        width: 100% !important;
        margin-top: 30px !important;
    }
`;

class RecoverAccountExportFile extends Component {
    state = {
        exportFile: this.props.exportFile,
        recoveringAccount: false,
        showCouldNotFindAccountModal: false,
    };

    handleChange = (exportFile) => {
        this.setState(() => ({
            exportFile,
        }));

        this.props.clearLocalAlert();
    };

    handleSubmit = async () => {
        const { exportFile } = this.state;

        try {
            this.setState({ recoveringAccount: true });

            const exportString = await new Promise((resolve) => {
                const fileReader = new FileReader();
                fileReader.addEventListener('loadend', () => {
                    resolve(fileReader.result);
                });
                fileReader.readAsText(exportFile);
            });

            await this.props.recoverAccountExportFile(exportString);
            await this.props.refreshAccount();

            Mixpanel.track('IE-SP Recovery with export file');

            this.props.redirectToApp();
        } catch (err) {
            this.props.showCustomAlert({
                success: false,
                messageCodeHeader: 'error',
                messageCode:
                    'walletErrorCodes.recoverAccountExportFile.errorExportFileNotValid',
                errorMessage: err.message,
            });

            Mixpanel.track('IE-SP Recover export file not valid');

            this.setState({ recoveringAccount: false });
            this.props.clearAccountState();
            return false;
        }
    };

    render() {
        const combinedState = {
            ...this.props,
            ...this.state,
        };

        return (
            <StyledContainer className='small-centered border'>
                <h1>
                    <Translate id='recoverExportFile.pageTitle' />
                </h1>
                <h2>
                    <Translate id='recoverExportFile.pageText' />
                </h2>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await this.handleSubmit();
                    }}
                    autoComplete='off'
                >
                    <RecoverAccountExportFileForm
                        {...combinedState}
                        handleChange={this.handleChange}
                    />
                </form>
            </StyledContainer>
        );
    }
}

const mapDispatchToProps = {
    recoverAccountExportFile,
    redirectTo,
    redirectToApp,
    refreshAccount,
    clearLocalAlert,
    clearGlobalAlert,
    clearAccountState,
    showCustomAlert,
    importZeroBalanceAccountPhrase,
    setZeroBalanceAccountImportMethod,
};

const mapStateToProps = (state, { match }) => ({
    ...selectAccountSlice(state),
    router: getRouter(state),
    localAlert: selectStatusLocalAlert(state),
    mainLoader: selectStatusMainLoader(state),
    findMyAccountSending: selectActionsPending(state, {
        types: ['RECOVER_ACCOUNT_EXPORT_FILE', 'REFRESH_ACCOUNT_OWNER'],
    }),
});

const RecoverAccountExportFileWithRouter = connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(RecoverAccountExportFile));

export default RecoverAccountExportFileWithRouter;
