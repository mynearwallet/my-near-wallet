import React, { useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import ListWrapper from './ListWrapper';
import ValidatorBox from './ValidatorBox';
import { METAPOOL_CONTRACT_ID } from '../../../services/metapool/constant';
import ValidatorBoxItem from './ValidatorBoxItem';
import classNames from '../../../utils/classNames';

export default function Validators({ validators, stakeFromAccount }) {
    const [isSelectedLiquidStaking, setSelectedLiquidStaking] = useState(false);
    const [validator, setValidator] = useState('');

    const validValidator = validators
        .map((validator) => validator.accountId)
        .includes(validator);

    return (
        <Container>
            <h1>
                <Translate id='staking.validators.title' />
            </h1>
            <h2>
                <Translate
                    id={`staking.validators.desc.${
                        stakeFromAccount ? 'account' : 'lockup'
                    }`}
                />
            </h2>
            <div className='tab'>
                <div
                    className={classNames([
                        'tab__item',
                        { active: !isSelectedLiquidStaking },
                    ])}
                    onClick={() => {
                        setSelectedLiquidStaking(false);
                    }}
                >
                    Standard Staking
                </div>
                <div
                    className={classNames([
                        'tab__item',
                        { active: isSelectedLiquidStaking },
                    ])}
                    onClick={() => {
                        setSelectedLiquidStaking(true);
                    }}
                >
                    Liquid Staking
                </div>
            </div>
            {isSelectedLiquidStaking ? (
                <>
                    <div className='description'>
                        <Translate id='staking.validators.liquidStakingDescription' />
                    </div>
                    <ListWrapper>
                        <ValidatorBoxItem
                            validatorId={METAPOOL_CONTRACT_ID}
                            linkTo='https://www.metapool.app/'
                            active
                            isSelectable
                        />
                    </ListWrapper>
                </>
            ) : (
                <>
                    <h4>
                        <Translate id='staking.validators.inputLabel' />
                    </h4>
                    <Translate>
                        {({ translate }) => (
                            <input
                                className='view-validator'
                                placeholder={translate(
                                    'staking.validators.inputPlaceholder'
                                )}
                                value={validator}
                                onChange={(e) => setValidator(e.target.value)}
                                autoFocus
                                spellCheck='false'
                                autoCapitalize='off'
                                data-test-id='stakingSearchForValidator'
                            />
                        )}
                    </Translate>
                    {validValidator && (
                        <div
                            className='input-validation-label success'
                            data-test-id='stakingPageValidatorFoundLabel'
                        >
                            <Translate id='staking.validators.search.success' />
                        </div>
                    )}
                    <ListWrapper>
                        {validators
                            .filter((v) => v.accountId.includes(validator))
                            .map((validator, i) => (
                                <ValidatorBox key={i} validator={validator} />
                            ))}
                    </ListWrapper>
                </>
            )}
        </Container>
    );
}

const Container = styled.div`
    .tab {
        display: flex;
        background: #f4f4f4;
        border-radius: 40px;
    }
    .tab__item {
        border-radius: 50px;
        padding: 0.8em 1em;
        width: 50%;
        text-align: center;
        cursor: pointer;
    }
    .tab__item.active {
        color: #fff;
        background-color: #7e7e7e;
    }
    .description {
        margin-top: 1em;
        padding: 1em;
    }
`;
