import { FC, useEffect } from 'react';
import { connect, batch } from 'react-redux';

import { setBlacklistedTokens, setBlacklistedTokenNames } from '../../redux/reducers/security';
import { fetchBlacklistedTokens } from '../../services/security/tokens';

type BootstrapProps = {};
type BootstrapActions = {
    initializeBlacklistedTokens: VoidFunction;
};

const Bootstrap: FC<BootstrapProps & BootstrapActions> = ({
    initializeBlacklistedTokens
}) => {
    useEffect(() => {
        initializeBlacklistedTokens();
    }, []);

    return null;
};

const mapDispatchToProps = (dispatch): BootstrapActions => ({
    initializeBlacklistedTokens: async () => {
        try {
            const blacklisted = await fetchBlacklistedTokens();

            if (blacklisted.length) {
                batch(() => {
                    dispatch(setBlacklistedTokens(blacklisted));
                    dispatch(setBlacklistedTokenNames(
                        new Set(blacklisted.map(({ address }) => address)))
                    );
                });
            }
        } catch (error) {
            console.error('Error on fetching blacklisted tokens', error);
        }
    }
});

export default connect(null, mapDispatchToProps)(Bootstrap);
