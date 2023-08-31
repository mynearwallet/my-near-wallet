import React from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';

function ConnectionBtn({ history }) {
    const { t } = useTranslation();

    return (
        <button
            type='button'
            onClick={() => history.push('/connection')}
            className='w-full mt-3 text-center text-md text-gray-600 underline hover:text-sky-600'
        >
            {t('connection.changeRpcProvider')}
        </button>
    );
}

export default withRouter(ConnectionBtn);
