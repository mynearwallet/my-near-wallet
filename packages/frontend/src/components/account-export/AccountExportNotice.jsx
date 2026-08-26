import React from 'react';
import styled from 'styled-components';

import InfoIconRounded from '../svg/InfoIconRounded.js';

const Notice = styled.section`
    align-items: center;
    background: ${(props) => (props.$variant === 'error' ? '#ffdbdb' : '#fff3df')};
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
        color: ${(props) => (props.$variant === 'error' ? '#dc1f25' : '#a15600')};
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
    const backgroundColor = isError ? '#ffdbdb' : '#fff3df';

    return (
        <Notice $variant={variant} role={isError ? 'alert' : 'note'}>
            <span className='notice-icon'>
                <InfoIconRounded
                    color={isError ? '#E5484D' : '#EF860D'}
                    filled
                    glyphColor={backgroundColor}
                />
            </span>
            <div className='notice-content'>{children}</div>
        </Notice>
    );
}
