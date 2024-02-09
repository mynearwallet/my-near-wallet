import bip39 from 'bip39-light';
import * as nearApiJs from 'near-api-js';
import { parseSeedPhrase } from 'near-seed-phrase';
import React from 'react';
import { Translate } from 'react-localize-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Container from '../../common/styled/Container.css';
import FullAccessKeyRotation from '../../profile/full_access_key_rotations/FullAccessKeyRotation';

const StyledContainer = styled(Container)`
    .authorized-app-box {
        margin: 30px 0;
    }

    h1 {
        display: flex;
        align-items: center;
        svg {
            width: 30px;
            height: 30px;
            margin-right: 15px;
        }
    }
`;

const bip39SeedPhrasePattern = /^(\w+\s+){11,23}\w+$/;
const ed25519PrivateKeyPattern =
    /^(ed25519:)?[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{88}$/;

export default ({ fullAccessKeys, accountId }) => {
    const [filterKey, setFilterKey] = React.useState('');

    const filteredFullAccessKeys = React.useMemo(() => {
        if (!filterKey) {
            return fullAccessKeys;
        }

        let inputSecretKey;

        if (ed25519PrivateKeyPattern.test(filterKey.trim())) {
            inputSecretKey = filterKey;
        } else if (bip39SeedPhrasePattern.test(filterKey.trim())) {
            try {
                bip39.validateMnemonic(filterKey.trim());
                inputSecretKey = parseSeedPhrase(filterKey).secretKey;
            } catch (err) {
                return [];
            }
        } else {
            return [];
        }

        const keyPair = nearApiJs.KeyPair.fromString(inputSecretKey);
        const publicKey = keyPair.publicKey.toString();

        return fullAccessKeys.filter((key) => key.public_key === publicKey);
    }, [filterKey, fullAccessKeys]);

    return (
        <StyledContainer className='medium centered'>
            <h1>
                <Translate id='fullAccessKeys.pageTitle' /> ({fullAccessKeys?.length})
            </h1>
            <Translate>
                {({ translate }) => (
                    <input
                        type='text'
                        value={filterKey}
                        placeholder={translate('fullAccessKeys.filterKey')}
                        onChange={(e) => setFilterKey(e.target.value)}
                    />
                )}
            </Translate>
            <div className='access-keys'>
                {fullAccessKeys?.length === 0 ? (
                    <Translate id='fullAccessKeys.dashboardLoading' />
                ) : filteredFullAccessKeys?.length === 0 ? (
                    <Translate id='fullAccessKeys.dashboardNoKeys' />
                ) : (
                    filteredFullAccessKeys?.map((accessKey, index) => (
                        <FullAccessKeyRotation key={index} fullAccessKey={accessKey} />
                    ))
                )}
            </div>
            <Link to={`/set-recovery/${accountId}?addKey=true`}>
                <Translate id='fullAccessKeys.addKey' />
            </Link>
        </StyledContainer>
    );
};
