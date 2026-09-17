import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Progress = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 0 56px;
    position: relative;

    &::before {
        background: #ecf1ff;
        content: '';
        height: 4px;
        left: 12.5%;
        position: absolute;
        right: 12.5%;
        top: 14px;
    }
`;

const Step = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
    z-index: 1;
`;

const Bubble = styled.span`
    align-items: center;
    background: ${(props) => (props.$active ? '#5380f5' : '#ecf1ff')};
    border-radius: 50%;
    color: ${(props) => (props.$active ? '#ecf1ff' : '#5380f5')};
    display: flex;
    flex: none;
    font-size: 14px;
    font-weight: 600;
    height: 32px;
    justify-content: center;
    line-height: 20px;
    width: 32px;
`;

const Label = styled.span`
    color: ${(props) => (props.$active ? '#000' : '#b4b4bc')};
    font-size: 12px;
    font-weight: ${(props) => (props.$active ? '600' : '400')};
    line-height: 16px;
    margin-top: 8px;
    padding: 0 4px;
    text-align: center;
`;

const STEPS = ['ready', 'activating', 'activated', 'secured'];

export default function NewKeyTransferProgress({ activeStep }) {
    const { t } = useTranslation();

    return (
        <Progress aria-label={t('newKeyTransfer.progressLabel')}>
            {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === activeStep;

                return (
                    <Step key={step}>
                        <Bubble $active={isActive}>{stepNumber}</Bubble>
                        <Label $active={isActive}>
                            {t(`newKeyTransfer.progressSteps.${step}`)}
                        </Label>
                    </Step>
                );
            })}
        </Progress>
    );
}
