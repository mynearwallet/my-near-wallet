import React from 'react';
import styled from 'styled-components';

import InfoIconRounded from '../svg/InfoIconRounded.js';

const NOTICE_COLORS = {
    warning: {
        background: '#fff3df',
        icon: '#EF860D',
        text: '#a15600',
    },
    error: {
        background: '#ffdbdb',
        icon: '#E5484D',
        text: '#dc1f25',
    },
    info: {
        background: '#E2EEFF',
        icon: '#5380F5',
        text: '#2757D5',
    },
};

const colorsFor = (variant) => NOTICE_COLORS[variant] || NOTICE_COLORS.warning;

const Notice = styled.section`
    align-items: center;
    background: ${(props) => colorsFor(props.$variant).background};
    border-radius: 12px;
    display: flex;
    gap: 16px;
    margin: 28px 0 32px;
    padding: 20px 24px;
    text-align: left;

    .notice-icon {
        align-items: center;
        display: flex;
        flex: none;
        height: 32px;
        justify-content: center;
        width: 32px;

        svg {
            height: 32px;
            width: 32px;
        }
    }

    .notice-content {
        flex: 1;
        min-width: 0;
    }

    p {
        color: ${(props) => colorsFor(props.$variant).text};
        font-weight: 400;
        line-height: 22px;
        margin: 0;
    }

    p + p {
        margin-top: 6px;
    }
`;

export default function AccountExportNotice({ children, variant = 'warning' }) {
    const isError = variant === 'error';
    const colors = colorsFor(variant);

    return (
        <Notice $variant={variant} role={isError ? 'alert' : 'note'}>
            <span className='notice-icon'>
                <InfoIconRounded
                    color={colors.icon}
                    filled
                    glyphColor={colors.background}
                />
            </span>
            <div className='notice-content'>{children}</div>
        </Notice>
    );
}
