import React, {FC} from 'react';

import { ArrowTapArea } from './ui';


type BackButtonProps = {
    onBack: VoidFunction;
}

const BackButton: FC<BackButtonProps> = ({onBack}) => {
    return (
        <ArrowTapArea onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="#9BA1A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="#9BA1A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

        </ArrowTapArea>
    );
};

export default BackButton;
