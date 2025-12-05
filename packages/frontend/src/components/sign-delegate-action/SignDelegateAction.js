/**
 * SignDelegateAction - UI component for approving NEP-366 meta-transactions
 *
 * Displays the delegate action details and allows users to approve or reject
 * the gasless transaction request.
 */

import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import FormButton from '../common/FormButton';
import FormButtonGroup from '../common/FormButtonGroup';
import Container from '../common/styled/Container.css';
import { formatActionArgs } from '../../utils/wallet/delegateAction';
import SafeTranslate from '../SafeTranslate';

const StyledContainer = styled(Container)`
    background-color: #f0f0f1;
    padding: 25px;

    .header {
        text-align: center;
        margin-bottom: 24px;
    }

    .title {
        font-size: 20px;
        font-weight: 600;
        color: #24272a;
        margin-bottom: 8px;
    }

    .subtitle {
        font-size: 14px;
        color: #72727a;
    }

    .gasless-badge {
        display: inline-block;
        background: #00ec97;
        color: #000;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 12px;
        letter-spacing: 0.5px;
    }

    .ledger-badge {
        display: inline-block;
        background: #1a1a2e;
        color: #fff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
        margin-left: 8px;
        letter-spacing: 0.5px;
    }

    .ledger-info {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 14px;
        margin: 20px 0;
        font-size: 13px;
        color: #92400e;
        line-height: 1.5;

        strong {
            display: block;
            margin-bottom: 4px;
        }
    }

    .details-card {
        background: #fff;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        border: 1px solid #e5e5e5;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f1;

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        &:first-child {
            padding-top: 0;
        }
    }

    .detail-label {
        color: #72727a;
        font-size: 13px;
        flex-shrink: 0;
    }

    .detail-value {
        color: #24272a;
        font-size: 13px;
        font-weight: 500;
        word-break: break-all;
        text-align: right;
        max-width: 60%;
    }

    .actions-section {
        margin: 20px 0;

        h3 {
            font-size: 14px;
            font-weight: 600;
            color: #24272a;
            margin-bottom: 12px;
        }
    }

    .action-item {
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 10px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .action-method {
        font-weight: 600;
        color: #24272a;
        font-size: 14px;
        font-family: monospace;
    }

    .action-args {
        font-size: 11px;
        color: #72727a;
        margin-top: 8px;
        font-family: monospace;
        word-break: break-all;
        white-space: pre-wrap;
        background: #f8f9fa;
        padding: 8px;
        border-radius: 4px;
        max-height: 120px;
        overflow-y: auto;
    }

    .info-box {
        background: #e8f4fd;
        border: 1px solid #b3d7f5;
        border-radius: 8px;
        padding: 14px;
        margin: 20px 0;
        font-size: 13px;
        color: #0072ce;
        line-height: 1.5;

        strong {
            display: block;
            margin-bottom: 4px;
        }
    }

    .error-box {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 14px;
        margin: 20px 0;
        font-size: 13px;
        color: #dc2626;
    }

    .button-group {
        margin-top: 25px;
    }
`;

const SignDelegateAction = ({
    accountId,
    receiverId,
    actions,
    meta,
    signing,
    error,
    onApprove,
    onCancel,
    disableApprove,
    isLedger,
}) => {
    return (
        <StyledContainer className='small-centered border brs-8 bsw-l'>
            <div className='header'>
                <div className='title'>
                    <Translate id='signDelegateAction.title' />
                </div>
                <div className='subtitle'>
                    <Translate id='signDelegateAction.subtitle' />
                </div>
                <div>
                    <span className='gasless-badge'>
                        <Translate id='signDelegateAction.gaslessBadge' />
                    </span>
                    {isLedger && (
                        <span className='ledger-badge'>Ledger</span>
                    )}
                </div>
            </div>

            <div className='details-card'>
                <div className='detail-row'>
                    <span className='detail-label'>
                        <Translate id='signDelegateAction.fromAccount' />
                    </span>
                    <span className='detail-value'>{accountId || '—'}</span>
                </div>
                <div className='detail-row'>
                    <span className='detail-label'>
                        <Translate id='signDelegateAction.contract' />
                    </span>
                    <span className='detail-value'>{receiverId}</span>
                </div>
                {meta?.referrer && (
                    <div className='detail-row'>
                        <span className='detail-label'>
                            <Translate id='signDelegateAction.requestedBy' />
                        </span>
                        <span className='detail-value'>{meta.referrer}</span>
                    </div>
                )}
            </div>

            <div className='actions-section'>
                <h3>
                    <Translate id='signDelegateAction.actionsToExecute' />
                </h3>
                {actions.map((action, index) => (
                    <div key={index} className='action-item'>
                        <div className='action-method'>{action.methodName}</div>
                        {action.args && (
                            <div className='action-args'>
                                {formatActionArgs(action.args)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className='info-box'>
                <strong>
                    <Translate id='signDelegateAction.howItWorks' />
                </strong>
                <SafeTranslate id='signDelegateAction.howItWorksDescription' />
            </div>

            {isLedger && signing && (
                <div className='ledger-info'>
                    <strong>
                        <Translate id='signDelegateAction.ledgerConfirmTitle' />
                    </strong>
                    <Translate id='signDelegateAction.ledgerConfirmMessage' />
                </div>
            )}

            {error && <div className='error-box'>{error}</div>}

            <FormButtonGroup>
                <FormButton
                    color='gray-blue'
                    onClick={onCancel}
                    disabled={signing}
                    data-test-id='reject-delegate-action'
                >
                    <Translate id='button.cancel' />
                </FormButton>
                <FormButton
                    onClick={onApprove}
                    disabled={signing || disableApprove}
                    sending={signing}
                    sendingString='button.signing'
                    data-test-id='approve-delegate-action'
                >
                    <Translate id='button.approve' />
                </FormButton>
            </FormButtonGroup>
        </StyledContainer>
    );
};

export default SignDelegateAction;
