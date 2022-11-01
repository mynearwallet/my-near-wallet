import React, { FC } from 'react';
import { StyledSettingsItem, StyledTitle, StyledIcon } from './ui';

type SettingsItemProps = {
    icon: React.ReactElement;
    control?: React.ReactElement;
    children: string;
};

const SettingsItem: FC<SettingsItemProps> = ({ icon, control, children }) => {
    return (
        <StyledSettingsItem>
            <StyledTitle>
                <StyledIcon>{icon}</StyledIcon>
                {children}
            </StyledTitle>
            {control}
        </StyledSettingsItem>
    );
};

export default SettingsItem;
