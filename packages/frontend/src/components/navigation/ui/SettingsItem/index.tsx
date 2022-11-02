import React, { FC } from 'react';

import { Mixpanel } from '../../../../mixpanel';
import { StyledSettingsItem, StyledTitle, StyledIcon } from './ui';

const track = (msg: string) => Mixpanel.track(msg);

type SettingsItemProps = {
    icon: React.ReactElement;
    control?: React.ReactElement;
    trackMsg?: string;
    children: React.ReactElement | React.ReactElement[] | string;
};

const SettingsItem: FC<SettingsItemProps> = ({ icon, control, trackMsg, children }) => {
    const handleClick = () => {
        if (trackMsg) {
            track(trackMsg);
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
