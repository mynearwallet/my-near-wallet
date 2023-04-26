import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import CONFIG from '../../config';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { Mixpanel } from '../../mixpanel/index';
import classNames from '../../utils/classNames';
import { ACCOUNT_CHECK_TIMEOUT } from '../../utils/wallet';
import { LocalAlertBox } from '../common/LocalAlertBox';
import { useTranslation } from 'react-i18next';
import type { LocalAlert } from '../common/types';

const InputWrapper = styled.div`
    position: relative;
    display: inline-block;
    font: 16px 'Inter';
    width: 100%;
    overflow: hidden;
    padding: 4px;
    margin: 5px -4px 30px -4px;

    input {
        margin-top: 0px !important;
    }

    &.wrong-char {
        input {
            animation-duration: 0.4s;
            animation-iteration-count: 1;
            animation-name: border-blink;

            @keyframes border-blink {
                0% {
                    box-shadow: 0 0 0 0 rgba(255, 88, 93, 0.8);
                }
                100% {
                    box-shadow: 0 0 0 6px rgba(255, 88, 93, 0);
                }
            }
        }
    }

    &.create {
        .input-suffix {
            position: absolute;
            color: #a6a6a6;
            pointer-events: none;
            top: 50%;
            transform: translateY(-50%);
            visibility: hidden;
        }
    }
`;

interface Props {
    defaultAccountId: string;
    type: string;
    pattern: string;
    stateAccountId: string;
    accountId: string;
    mainLoader: any;
    disabled: boolean;
    localAlert: LocalAlert;
    clearLocalAlert: () => void;
    handleChange: (accountId: string) => void;
    checkAvailability: (accountId: string) => void;
}

export const AccountFormAccountId: React.FunctionComponent<Props> = ({
    defaultAccountId,
    type = 'check',
    pattern = /[^a-zA-Z0-9._-]/,
    handleChange,
    checkAvailability,
    clearLocalAlert,
    stateAccountId,
    mainLoader,
    disabled,
    localAlert: localAlertFromProps,
    accountId: accountIdFromProps,
}) => {
    const [accountId, setAccountId] = useState(defaultAccountId || '');
    const [invalidAccountIdLength, setInvalidAccountIdLength] = useState(false);
    const [wrongChar, setWrongChar] = useState(false);
    const debouncedAccountId = useDebouncedValue(accountId, ACCOUNT_CHECK_TIMEOUT);
    const canvas = useRef<HTMLCanvasElement>(null);
    const suffix = useRef(null);
    const { t } = useTranslation();

    const handleChangeAccountId = ({
        userValue,
        el,
    }: {
        userValue: string;
        el?: any;
    }) => {
        const currentAccountId = userValue.toLowerCase();

        if (currentAccountId === accountId) {
            return;
        }

        if (currentAccountId.match(pattern)) {
            if (wrongChar) {
                el.style.animation = 'none';
                void el.offsetHeight;
                el.style.animation = null;
            } else {
                setWrongChar(true);
            }
            return false;
        } else {
            setWrongChar(false);
        }

        setAccountId(currentAccountId);
        handleChange(currentAccountId);
        localAlertFromProps && clearLocalAlert();
        invalidAccountIdLength && handleAccountIdLengthState(currentAccountId);
    };

    useEffect(() => {
        if (defaultAccountId) {
            handleChangeAccountId({ userValue: accountId });
        }
    }, []);

    useEffect(() => {
        handleCheckAvailability(accountId, type);
    }, [debouncedAccountId]);

    const updateSuffix = (userValue: string) => {
        if (userValue.match(pattern)) {
            return;
        }

        const isSafari =
            /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
        const width = getTextWidth(userValue, '16px Inter');
        const extraSpace = isSafari ? 21.5 : 22;
        suffix.current.style.left = `${width + extraSpace}px`;
        suffix.current.style.visibility = 'visible';
        if (userValue.length === 0) {
            suffix.current.style.visibility = 'hidden';
        }
    };

    const getTextWidth = (text: string, font: string) => {
        if (!canvas.current) {
            canvas.current = document.createElement('canvas');
        }
        const context = canvas.current.getContext('2d');
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    };

    const isAccountIdLengthValid = (accountId: string) => {
        const accountIdWithSuffix = `${accountId}.${CONFIG.ACCOUNT_ID_SUFFIX}`;
        return accountIdWithSuffix.length >= 2 && accountIdWithSuffix.length <= 64;
    };

    const handleAccountIdLengthState = (accountId: string) =>
        setInvalidAccountIdLength(!!accountId && !isAccountIdLengthValid(accountId));

    const handleCheckAvailability = (currentAccountId: string, type: string) => {
        if (type === 'create') {
            Mixpanel.track('CA Check account availability');
        }
        if (!currentAccountId) {
            return false;
        }
        if (isImplicitAccount(currentAccountId)) {
            return true;
        }
        if (!(type === 'create' && !isAccountIdLengthValid(currentAccountId))) {
            return checkAvailability(
                type === 'create' ? accountIdFromProps : currentAccountId
            );
        }
        return false;
    };

    const isSameAccount = () => type !== 'create' && stateAccountId === accountId;

    const isImplicitAccount = (accountId) => type !== 'create' && accountId.length === 64;

    const localAlertWithFormValidation = () => {
        if (!accountId) {
            return null;
        }
        if (isImplicitAccount(accountId)) {
            return {
                success: true,
                messageCode: 'account.available.implicitAccount',
            };
        }
        if (mainLoader) {
            return {
                messageCode: `account.create.checkingAvailablity.${type}`,
            };
        }
        if (invalidAccountIdLength) {
            return {
                success: false,
                messageCode: 'account.create.errorInvalidAccountIdLength',
            };
        }
        if (isSameAccount()) {
            return {
                success: false,
                show: true,
                messageCode: 'account.available.errorSameAccount',
            };
        }
        return localAlertFromProps;
    };

    const localAlert = localAlertWithFormValidation();
    const success = localAlert?.success;
    const problem = !localAlert?.success && localAlert?.show;

    return (
        <>
            <InputWrapper
                className={classNames([
                    type,
                    { success: success },
                    { problem: problem },
                    { 'wrong-char': wrongChar },
                ])}
            >
                <input
                    name='accountId'
                    data-test-id='createAccount.accountIdInput'
                    value={accountId}
                    onInput={(e) =>
                        type === 'create' && updateSuffix((e as any).target.value.trim())
                    }
                    onChange={(e) =>
                        handleChangeAccountId({
                            userValue: e.target.value.trim(),
                            el: e.target,
                        })
                    }
                    placeholder={
                        type === 'create'
                            ? t('createAccount.accountIdInput.placeholder', {
                                  data: CONFIG.ACCOUNT_ID_SUFFIX,
                              })
                            : t('input.accountId.placeholder')
                    }
                    required
                    autoComplete='off'
                    autoCorrect='off'
                    autoCapitalize='off'
                    spellCheck='false'
                    tabIndex={1}
                    disabled={disabled}
                />
                {type === 'create' && (
                    <span className='input-suffix' ref={suffix}>
                        .{CONFIG.ACCOUNT_ID_SUFFIX}
                    </span>
                )}
                {type !== 'create' && (
                    <div className='input-sub-label'>{t('input.accountId.subLabel')}</div>
                )}
            </InputWrapper>
            <LocalAlertBox
                dots={mainLoader}
                localAlert={localAlert}
                accountId={accountIdFromProps}
            />
        </>
    );
};
