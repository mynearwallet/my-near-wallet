import { getLocation } from 'connected-react-router';
import React from 'react';
import { useSelector } from 'react-redux';

import RecoverAccount from './RecoverAccount';
import isMobile from '../../utils/isMobile';

const RecoverAccountWrapper = () => {
    const location = useSelector(getLocation);

    return <RecoverAccount locationSearch={location.search} isMobile={isMobile()} />;
};

export default RecoverAccountWrapper;
