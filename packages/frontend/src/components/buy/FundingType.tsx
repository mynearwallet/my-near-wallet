import React from 'react';
import styled from 'styled-components';

import arrow from './assets/arrow.svg';
import LoadingDots from '../common/loader/LoadingDots';

const hoverEffect = (isEnabled: boolean) =>
    isEnabled ? '&:hover { background: #f9f9f9; }' : '';

const paledIf = (isDisabled: boolean) =>
    isDisabled ? 'opacity: 0.5; filter: grayscale(1);' : '';

const LinkWrap = styled.a<{ disabled: boolean }>`
    display: block;
    border-top: 1px solid #f0f0f1;
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
    ${({ disabled }) => hoverEffect(!disabled)}
    ${({ disabled }) => paledIf(disabled)}
    @media (max-width: 992px) {
        :first-child {
            border: 0;
        }
    }
    @media (max-width: 580px) {
        :first-child {
            border-top: 1px solid #f0f0f1;
        }
    }
`;

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 68px;
    padding: 0 32px;
    @media (max-width: 580px) {
        padding: 0 12px;
    }
`;

const ImageContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const Button = styled.div`
    background-image: url(${arrow});
    width: 24px;
    height: 24px;
`;

const WrapperImg = styled.div`
    display: flex;
`;

interface Props {
    icon: string;
    link: string;
    name: string;
    track?: () => void;
    disabled: boolean;
}

export const FundingType: React.FunctionComponent<Props> = ({
    icon,
    link,
    name,
    track,
    disabled,
}) => {
    return (
        <LinkWrap
            href={link}
            target='_blank'
            rel='noreferrer'
            onClick={() => track && track()}
            disabled={disabled}
        >
            <Wrapper>
                <ImageContainer>
                    <WrapperImg title={name}>
                        <img src={icon} alt={name} />
                    </WrapperImg>
                    {!link && <LoadingDots />}
                </ImageContainer>
                {disabled ? null : <Button />}
            </Wrapper>
        </LinkWrap>
    );
};
