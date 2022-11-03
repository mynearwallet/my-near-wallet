import { useEffect, FC } from 'react';
import { useDispatch } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { actions as securityActions } from '../../redux/slices/security';

const { initializeBlacklistedTokens } = securityActions;

const Bootstrap: FC<RouteComponentProps> = ({ history }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(initializeBlacklistedTokens());
    }, []);

    // Scroll to top on every page opening
    useEffect(() => {
        const unlisten = history.listen(() => window.scrollTo(0, 0));

        return () => unlisten();
    }, []);

    return null;
};

export default withRouter(Bootstrap);
