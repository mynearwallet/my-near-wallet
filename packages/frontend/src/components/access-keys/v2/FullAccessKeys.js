import React from 'react';
import { Translate } from 'react-localize-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Container from '../../common/styled/Container.css';
import FullAccessKeyRotation from '../../profile/full_access_key_rotations/FullAccessKeyRotation';

const StyledContainer = styled(Container)`
    .authorized-app-box {
        margin: 30px 0;
    }

    h1 {
        display: flex;
        align-items: center;
        svg {
            width: 30px;
            height: 30px;
            margin-right: 15px;
        }
    }
`;

export default ({ fullAccessKeys, accountId }) => {
    return (
        <StyledContainer className='medium centered'>
            <h1>
                <Translate id='fullAccessKeys.pageTitle' /> ({fullAccessKeys?.length})
            </h1>
            <div className='access-keys'>
                {fullAccessKeys?.map((accessKey, index) => (
                    <FullAccessKeyRotation key={index} fullAccessKey={accessKey} />
                ))}
                {fullAccessKeys?.length === 0 && (
                    <Translate id='fullAccessKeys.dashboardNoKeys' />
                )}
            </div>
            <Link to={`/set-recovery/${accountId}?addKey=true`}>
                <Translate id='fullAccessKeys.addKey' />
            </Link>
        </StyledContainer>
    );
};
