import React from 'react';
import styled from 'styled-components';

import GlobeIcon from '../../svg/GlobeIcon';

const StyledContainer = styled.div`
    border: 1px solid #a47fcf;
    background-color: #f9f1fd;
    color: #a47fcf;
    padding: 6px 12px;
    border-radius: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    word-break: break-all;

    > svg {
        margin-right: 10px;
        min-width: 17px;
    }

    > span {
        font-size: 14px;
        font-weight: 600;
        width: 100%;
        text-align: center;
    }
`;

export default ({ privateShardInfo }) => {
    return (
        <StyledContainer className='connect-with-application'>
            <GlobeIcon />
            <span>{privateShardInfo.shardId}</span>
        </StyledContainer>
    );
};
