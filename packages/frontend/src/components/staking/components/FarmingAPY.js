import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import Tooltip from '../../common/Tooltip';

const Container = styled.div`
    background-color: #fff0de;
    color: #a15600;
    font-weight: 600;
    border-radius: 4px;
    padding: 10px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 13px;

    .tooltip {
        svg {
            path {
                stroke: #ef860d;
            }
        }

        :hover {
            svg {
                path {
                    stroke: #a15600;
                }
            }
        }
    }

    .fee {
        margin-left: auto;
        color: #452500;
    }
`;

export function FarmingAPY({ apy }) {
    return (
        <Container>
            <Translate id='staking.validator.apy' />
            <Tooltip translate='staking.balanceBox.farm.info' />
            <span className='fee'>{apy}%</span>
        </Container>
    );
}
