import React, { useState } from 'react';
import styled from 'styled-components';

import CreateCustomNameLightBanner from './CreateCustomNameLightBanner';
import ExploreNativeBanner from './ExploreNativeBanner';
import { isSunsetCapabilityEnabled } from '../../config/sunset';

const StyledContainer = styled.div`
    background-color: transparent;
    border-radius: 8px;
    padding-bottom: 30px;
    margin-bottom: 35px;
    height: 435px;

    background: linear-gradient(180deg, #e8faff 0%, #d7e0ff 100%);
    border-radius: 8px;
    color: #25272a;

    .dots {
        height: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        .dot {
            width: 8px;
            height: 8px;
            background-color: #d5d4d8;
            border-radius: 50%;
            margin: 0 5px;
            cursor: pointer;

            &.active {
                background-color: #8fcdff;
            }
        }
    }
`;

const StyledBanner = styled.div`
    padding: 16px;
    height: 395px;
    margin-bottom: 10px;
`;

export default ({ availableAccounts }) => {
    const [activeComponent, setActiveComponent] = useState('ExploreApps');
    // The custom-name slide creates a new named account, which the sunset retires.
    const canCreateAccount = isSunsetCapabilityEnabled('createAccount');

    // Explore is the last slide left; once it is retired too there is nothing to show.
    if (!isSunsetCapabilityEnabled('explore')) {
        return null;
    }

    return (
        <StyledContainer>
            <StyledBanner>
                {activeComponent === 'ExploreApps' || !canCreateAccount ? (
                    <ExploreNativeBanner />
                ) : (
                    <CreateCustomNameLightBanner />
                )}
            </StyledBanner>
            {availableAccounts && canCreateAccount && (
                <div className='dots'>
                    <div
                        className={`dot ${
                            activeComponent === 'ExploreApps' ? 'active' : ''
                        }`}
                        onClick={() => setActiveComponent('ExploreApps')}
                    ></div>
                    <div
                        className={`dot ${
                            activeComponent === 'CreateCustomName' ? 'active' : ''
                        }`}
                        onClick={() => setActiveComponent('CreateCustomName')}
                    ></div>
                </div>
            )}
        </StyledContainer>
    );
};
