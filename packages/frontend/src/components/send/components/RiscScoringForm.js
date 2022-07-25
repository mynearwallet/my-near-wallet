import React, { useCallback, useEffect, useState } from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import { HAPI_RISK_SCORING } from '../../../../../../features';
import iconWarning from '../../../images/icon-warning.svg';
import { checkAddress } from '../../../services/RiscScoring';

const RSContainer = styled.div`
    margin-top: 20px;
    margin-bottom: -25px;
`;

const RSWarning = styled.div`
    background: #FFEFEF;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 16px 12px;
    gap: 10px;
    color: #CD2B31;
    font-size: 12px;
    line-height: 16px;
`;

const RSConsent = styled.div`
    margin-top: 38px;
    line-height: 20px;
    color: #000000;
    display: flex;
    padding-left: 26px;

    & label {
      user-select: none;
      display: flex;
      gap: 0 12px;
      
      & input {
        width: inherit;
        height: inherit;
        border: none;
        appearance: auto;
        position: inherit;
        margin: 0;
        background: none;
        box-shadow: none;
      }
    }
`;

export function useRiskScoringCheck (accountId) {
    const [isRSWarned, setIsRSWarned] = useState(false);
    const [isRSIgnored, setIsRSIgnored] = useState(false);

    useEffect(() => {
        let isActive = true;
        async function checkAccountWithHapi() {
            try {
                const hapiStatus = await checkAddress({accountId});
                if (isActive && hapiStatus && hapiStatus[0] !== 'None') { 
                    setIsRSWarned(true);
                }
            } catch (e) {
                // continue work
            }
        }

        if (HAPI_RISK_SCORING && accountId) {
            checkAccountWithHapi();
        } else {
            setIsRSWarned(false);
        }

        return () => { // prevent race condition
            isActive = false;
        };
    }, [accountId]);

    return { isRSWarned, isRSIgnored, setIsRSIgnored };
}


const RiscScoringForm = ({ setIsRSIgnored }) => {
    const onCheckboxChange = useCallback((e) => {
        setIsRSIgnored(e.target.checked);
    }, []);

    return (
        <RSContainer className="risk-scoring-warning">
            <RSWarning>
                <img src={iconWarning} alt="Warning"/>
                <div>
                    <Translate id='riscScoring.scamWarning' />
                </div>
            </RSWarning>
            <RSConsent>
                <label>
                    <input type="checkbox" onChange={onCheckboxChange}/>
                    <Translate id='riscScoring.checkbox' />
                </label>
            </RSConsent>
        </RSContainer>
    );
};

export default RiscScoringForm;