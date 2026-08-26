import React from 'react';
import styled from 'styled-components';

import ExportAccountRemovalWarningIcon from '../svg/ExportAccountRemovalWarningIcon';

const Notice = styled.section`
    align-items: center;
    background: ${(props) => (props.$variant === 'error' ? '#ffdbdb' : '#fff3df')};
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    margin: 28px 0 32px;
    padding: 28px 24px;
    text-align: center;

    .notice-icon {
        height: 56px;
        margin-bottom: 20px;
        width: 64px;
    }

    p {
        color: ${(props) => (props.$variant === 'error' ? '#dc1f25' : '#a15600')};
        font-weight: 400;
        line-height: 22px;
        margin: 0;
    }

    p + p {
        margin-top: 14px;
    }
`;

export default function AccountExportNotice({ children, variant = 'warning' }) {
    const isError = variant === 'error';

    return (
        <Notice $variant={variant} role={isError ? 'alert' : 'note'}>
            <ExportAccountRemovalWarningIcon
                className='notice-icon'
                color={isError ? '#E5484D' : '#EF860D'}
            />
            {children}
        </Notice>
    );
}
