import React from 'react';
import styled from 'styled-components';

import classNames from '../../utils/classNames';
import SafeTranslate from '../SafeTranslate';
import { LocalAlert } from './types';

const LocalAlertBoxContainer = styled.div`
    font-weight: 500;
    margin-top: -25px;
    padding-bottom: 9px;
    line-height: 16px;

    &.problem {
        color: #ff585d;
    }
    &.success {
        color: #00c08b;
    }

    &.dots {
        color: #4a4f54;

        :after {
            content: '.';
            animation: link 1s steps(5, end) infinite;

            @keyframes link {
                0%,
                20% {
                    color: rgba(0, 0, 0, 0);
                    text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                40% {
                    color: #4a4f54;
                    text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                60% {
                    text-shadow: 0.3em 0 0 #4a4f54, 0.6em 0 0 rgba(0, 0, 0, 0);
                }
                80%,
                100% {
                    text-shadow: 0.3em 0 0 #4a4f54, 0.6em 0 0 #4a4f54;
                }
            }
        }
    }

    @media screen and (max-width: 991px) {
        font-size: 12px;
    }
`;

interface Props {
    localAlert: LocalAlert;
    accountId: string;
    dots: boolean;
}

/**
 * Renders request status.
 *
 * @param localAlert {object} request status, can be null in case not completed yet / no outgoing request
 * @param localAlert.success {boolean} true if request was successful
 * @param localAlert.messageCode {string} localization code of status message to display
 */
export const LocalAlertBox: React.FunctionComponent<Props> = ({
    localAlert,
    accountId,
    dots,
}) =>
    localAlert?.show ? (
        <LocalAlertBoxContainer
            className={classNames([
                'alert-info',
                { success: localAlert.success },
                { problem: !localAlert.success },
                { dots: dots },
            ])}
        >
            <SafeTranslate id={localAlert.messageCode} data={{ accountId: accountId }} />
        </LocalAlertBoxContainer>
    ) : null;
