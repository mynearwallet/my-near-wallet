import React, { FC } from 'react';

import { Mixpanel } from '../../../../mixpanel';
import { StyledSettingsItem, StyledTitle, StyledIcon } from './ui';

type SettingsItemProps = {
    icon: React.ReactElement;
    control?: React.ReactElement;
    trackMsg?: string;
    children: React.ReactElement | React.ReactElement[] | string;
};

const SettingsItem: FC<SettingsItemProps> = ({ icon, control, trackMsg, children }) => {
    const handleClick = () => {
        if (trackMsg) {
            Mixpanel.track(trackMsg);
        }
    };

    return (
        <StyledSettingsItem onClick={handleClick}>
            <StyledTitle>
                <StyledIcon>{icon}</StyledIcon>
                {children}
            </StyledTitle>
            {control}
        </StyledSettingsItem>
    );
};

export default SettingsItem;
