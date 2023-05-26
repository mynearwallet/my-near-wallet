import PropTypes from 'prop-types';
import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import IntFlagIcon from '../../../images/int-flag-small.svg';
import classNames from '../../../utils/classNames';
import EmailIconOne from '../../svg/EmailIconOne';
import HardwareWalletIcon from '../../svg/HardwareWalletIcon';
import PassPhraseIcon from '../../svg/PassPhraseIcon';
import PhoneIconOne from '../../svg/PhoneIconOne';

const Container = styled.div`
    background-color: #fafafa;
    border-radius: 8px;
    padding: 15px;
    max-width: 500px;
    cursor: pointer;
    position: relative;
    margin-top: 20px;
    border-left: 4px solid #fafafa;
    overflow: hidden;

    @media (max-width: 499px) {
        margin: 20px -14px 0 -14px;
        border-radius: 0 !important;
    }

    .color-red {
        margin-top: 15px;
    }

    :before {
        content: '';
        height: 23px;
        width: 23px;
        top: 29px;
        border: 2px solid #e6e6e6;
        position: absolute;
        border-radius: 50%;
    }

    .title {
        color: #3f4045;
        font-weight: 600;
    }

    .desc {
        color: #72727a;
        max-width: 270px;
        margin-top: 5px;

        @media (max-width: 450px) {
            max-width: 240px;
        }

        @media (max-width: 360px) {
            max-width: 175px;
        }
    }

    svg {
        &.hardware-wallet-icon {
            width: 66px;
            margin-right: -23px;
            position: absolute;
            right: 0;
            top: -6px;
        }
    }

    &.active {
        background-color: #f0f9ff;
        cursor: default;
        border-left: 4px solid #2b9af4;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;

        :before {
            background-color: #2b9af4;
            border-color: #2b9af4;
        }

        :after {
            content: '';
            position: absolute;
            transform: rotate(45deg);
            left: 23px;
            top: 37px;
            height: 11px;
            width: 11px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 1px 0px 2px 0px #0000005;
        }

        .title {
            color: #003560;
        }

        .desc {
            color: #005497;
        }

        > hr {
            border: 0;
            background-color: #d6edff;
            height: 1px;
            margin: 20px -15px 0px -15px;
        }
    }
    &.inputProblem {
        border-color: #ff585d;
    }

    input {
        margin-top: 20px !important;
    }

    .react-phone-number-input {
        position: relative;

        .react-phone-number-input__country {
            position: absolute;
            right: 0;
            z-index: 1;
            top: 50%;
            transform: translateY(calc(-50% + 10px));
        }

        .react-phone-number-input__icon {
            &:not(.react-phone-number-input__icon--international) {
                margin-right: 5px;
            }
        }

        .react-phone-number-input__icon--international {
            svg {
                display: none;
            }

            background-image: url(${IntFlagIcon});
            background-repeat: no-repeat;
        }

        .react-phone-number-input__icon {
            border: 0;
        }

        .react-phone-number-input__country-select-arrow {
            width: 8px;
            height: 8px;
            border-color: black;
            border-width: 0 1px 1px 0;
            transform: rotate(45deg);
            margin-top: -1px;
            margin-left: 5px;
            margin-right: 5px;
        }

        select {
            font-size: 16px;
        }
    }

    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

const Header = styled.div`
    position: relative;
    padding-left: 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    svg {
        width: 50px;
    }
`;

const Icon = ({ option, color }) => {
    switch (option) {
        case 'email':
            return <EmailIconOne color={color} />;
        case 'phone':
            return <PhoneIconOne color={color} />;
        case 'phrase':
            return <PassPhraseIcon color={color} />;
        case 'ledger':
            return <HardwareWalletIcon color={color} />;
        default:
            return '';
    }
};

const RecoveryOption = ({ children, option, onClick, active, disabled, problem }) => {
    active = active === option;

    return (
        <Container
            onClick={!disabled ? onClick : undefined}
            className={classNames([
                { active: active && !disabled, disabled, inputProblem: problem },
            ])}
            data-test-id={`recoveryOption.${option}`}
        >
            <Header>
                <div>
                    <div className='title'>
                        <Translate id={`setupRecovery.${option}Title`} />
                    </div>
                    <div className='desc'>
                        <Translate id={`setupRecovery.${option}Desc`} />
                    </div>
                </div>
                <Icon option={option} color={active} />
            </Header>
            {active && option !== 'phrase' && option !== 'ledger' && <hr />}
            {!disabled && active && children}
        </Container>
    );
};

RecoveryOption.propTypes = {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    option: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    active: PropTypes.string.isRequired,
    problem: PropTypes.bool,
};

export default RecoveryOption;
