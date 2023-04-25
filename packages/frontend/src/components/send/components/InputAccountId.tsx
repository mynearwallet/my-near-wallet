import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import classNames from '../../../utils/classNames';
import { ACCOUNT_CHECK_TIMEOUT } from '../../../utils/wallet';
import CheckCircleIcon from '../../svg/CheckCircleIcon';
import { LocalAlert } from '../../common/types';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { useTranslation } from 'react-i18next';

const InputWrapper = styled.div`
    position: relative;
    font: 16px 'Inter';
    width: 100%;
    overflow: hidden;

    input {
        margin-top: 0px;
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

    &.success, &.problem {
        input {
            border: 0;
        }
    }

    input {
        text-align: right;
        border: 0;
        padding-right: 15px;
        background-color: transparent;

        &:focus {
            box-shadow: none;
        }
    }

    .check-circle-icon {
        width: 18px;
        height: 18px;
    }

    .success-prefix {
        position: absolute;
        pointer-events: none;
        top: 50%;
        transform: translateY(-50%);
        height: 18px;
        opacity: 0;
        margin-top: 1px;
        visibility: hidden;
    }

    &.success {
        input {
            color: #008D6A;
            &:focus {
                box-shadow: none;
            }
        }
        .success-prefix {
            opacity: 1;
        }
    }

    &.problem {
        input {
            color: #FC5B5B;
            &:focus {
                box-shadow: none;
            }
        }
    }
`;
interface Props {
    accountId: string
    localAlert: LocalAlert
    disabled: boolean
    autoFocus: boolean
    isSuccess: boolean
    isProblem: boolean
    onFocus: () => void
    onBlur: () => void
    handleChange: (accountId: string) => void
    clearLocalAlert: () => void
    setIsImplicitAccount: (isImplicitAccount: boolean) => void
    checkAvailability: (accountId: string) => void
}


export const InputAccountId: React.FunctionComponent<Props> = ({
    accountId,
    disabled,
    autoFocus,
    isSuccess,
    isProblem,
    localAlert,
    onBlur,
    onFocus,
    handleChange,
    clearLocalAlert,
    setIsImplicitAccount,
    checkAvailability
}) => {
    const [wrongChar, setWrongChar] = useState(false)
    let canvas = useRef<HTMLCanvasElement>(null)
    const prefix = useRef(null);
    const debouncedAccountId = useDebouncedValue(accountId, ACCOUNT_CHECK_TIMEOUT);
    const { t } = useTranslation()

    useEffect(() => {
        if (accountId) {
            handleChangeAccountId({ userValue: accountId });
            updatePrefix(accountId);
        }
    }, [])

    useEffect(() => {
        handleCheckAvailability(accountId);
    }, [debouncedAccountId]);

    const updatePrefix = (userValue: string) => {
        // FIX: Handle prefix placement for overflowing input (implicit accounts, etc.)
        const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
        const width = getTextWidth(userValue, '16px Inter');
        const extraSpace = isSafari ? 22 : 23;
        prefix.current.style.right = `${width + extraSpace}px`;
        prefix.current.style.visibility = 'visible';
        if (userValue.length === 0) {
            prefix.current.style.visibility = 'hidden';
        }
    }

    const getTextWidth = (text: string, font: string) => {
        if (!canvas.current) {
            canvas.current = document.createElement('canvas');
        }
        let context = canvas.current.getContext('2d');
        context.font = font;
        let metrics = context.measureText(text);
        return metrics.width;
    }

    const handleChangeAccountId = ({ userValue, el }: { userValue: string, el?: any }) => {
        const pattern = /[^a-zA-Z0-9._-]/;

        const accountId = userValue.trim().toLowerCase();

        if (accountId.match(pattern)) {
            if (wrongChar) {
                el.style.animation = 'none';
                void el.offsetHeight;
                el.style.animation = null;
            } else {
                setWrongChar(true)
            }
            return;
        } else {
            setWrongChar(false)
        }

        setIsImplicitAccount(false);
        handleChange(accountId);

        localAlert && clearLocalAlert();
    }

    const isImplicitAccount = (accountId: string) => accountId.length === 64 && !accountId.includes('.')

    const handleCheckAvailability = async (accountId: string) => {
        if (!accountId) {
            return false;
        }

        try {
            await checkAvailability(accountId);
        } catch (e) {
            if (isImplicitAccount(accountId) && e.toString().includes('does not exist while viewing')) {
                console.warn(`${accountId} does not exist. Assuming this is an implicit Account ID.`);
                clearLocalAlert();
                setIsImplicitAccount(true);
                return;
            }
        }
    }

    return (
        <InputWrapper className={classNames([{ 'success': isSuccess }, { 'problem': isProblem }, { 'wrong-char': wrongChar }])}>
            <input
                value={accountId}
                onInput={(e) => updatePrefix((e as any).target.value)}
                onChange={(e) => handleChangeAccountId({ userValue: e.target.value, el: e.target })}
                placeholder={t('input.accountId.placeHolderAlt')}
                required
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                spellCheck='false'
                tabIndex={1}
                disabled={disabled}
                autoFocus={autoFocus}
                onBlur={onBlur}
                onFocus={onFocus}
                data-test-id="sendMoneyPageAccountIdInput"
            />
            <span className='success-prefix' ref={prefix}>
                <CheckCircleIcon color='#00C08B' />
            </span>
        </InputWrapper>
    )
}
