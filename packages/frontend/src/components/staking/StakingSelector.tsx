import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import Card from '../common/styled/Card.css';
import Container from '../common/styled/Container.css';

const StakingSelector = () => {
    return (
        <SContainer>
            <div>Staking</div>
            <SBox>
                <Link to={'/staking'}>
                    <SCard>
                        <div>Standard Staking</div>
                        <div>Lock up your NEAR to receive ~10% APY</div>
                    </SCard>
                </Link>
            </SBox>
            <SBox>
                <Link to={'/liquid-staking'}>
                    <SCard>
                        <div>Liquid Staking</div>
                        <div>
                            Stake your NEAR to receive stake tokens. You can then reinvest
                            these.
                        </div>
                    </SCard>
                </Link>
            </SBox>
        </SContainer>
    );
};

export default StakingSelector;

const SContainer = styled(Container)`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 16px;
`;

const SBox = styled.div`
    width: 100%;
`;

const SCard = styled(Card)`
    width: 100%;
    color: #444;
    &:hover {
        background-color: #eee;
        text-decoration: none;
    }
`;
