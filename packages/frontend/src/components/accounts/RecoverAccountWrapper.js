import { getLocation } from 'connected-react-router';
import React from 'react';
import { useSelector } from 'react-redux';

import isMobile from '../../utils/isMobile';
import RecoverAccount from './RecoverAccount';

const RecoverAccountWrapper = () => {
    const location = useSelector(getLocation);

    return (
        <RecoverAccount
            locationSearch={location.search}
            isMobile={isMobile()}
        />
    );
};

export default RecoverAccountWrapper;
