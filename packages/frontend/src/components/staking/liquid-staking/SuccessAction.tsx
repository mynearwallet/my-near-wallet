import React from 'react';
import TransferMoneyIcon from '../../svg/TransferMoneyIcon';
import { Translate } from 'react-localize-redux';
import ValidatorBox from '../components/ValidatorBox';
import FormButton from '../../common/FormButton';
import Container from '../../common/styled/Container.css';
import styled from 'styled-components';

type Props = {
    action: 'stake' | 'unstake' | 'liquidUnstake';
    stakedAmountYocto: string;
    changesAmount: string;
    accountId: string;
    token: any;
};

const SuccessAction = ({
    action,
    stakedAmountYocto = '',
    changesAmount = '',
    accountId,
    token,
}: Props) => {
    return (
        <StyledContainer className='small-centered text-center'>
            <TransferMoneyIcon />
            <h1>
                <Translate id={`staking.${action}Success.title`} />
            </h1>
            <div className='desc' data-test-id='stakingSuccessMessage'>
                <Translate
                    id={`staking.${action}Success.desc`}
                    data={{
                        amount: `${changesAmount} ${token.onChainFTMetadata?.symbol}`,
                    }}
                />
            </div>
            {/* @ts-ignore */}
            <ValidatorBox
                validator={{
                    accountId,
                    active: true,
                }}
                amount={stakedAmountYocto}
                clickable={false}
                style={{ margin: '40px 0' }}
                token={token}
            />
            <div className='desc'>
                <Translate id={`staking.${action}Success.descTwo`} />
            </div>
            <FormButton
                linkTo='/staking'
                className='gray-blue'
                trackingId='STAKE/UNSTAKE Return to dashboard'
                data-test-id='returnToDashboardButton'
            >
                <Translate id={`staking.${action}Success.button`} />
            </FormButton>
        </StyledContainer>
    );
};

export default SuccessAction;

const StyledContainer = styled(Container)`
    margin-top: 4em;
    .desc {
        margin-top: 0.5em;
    }
    button {
        width: 100%;
    }
`;
