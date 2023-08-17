import { faWifi } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { withRouter } from 'react-router';

function ConnectionBtn({ history }) {
    return (
        <FontAwesomeIcon
            className='flex-initial text-gray-400 text-lg hover:text-gray-900 cursor-pointer mr-3'
            onClick={() => history.push('/connection')}
            icon={faWifi}
        />
    );
}

export default withRouter(ConnectionBtn);
