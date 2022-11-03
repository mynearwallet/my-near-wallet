import styled from 'styled-components';

import { VIEWPORT } from '../../../../shared/ui/mixins/viewport';

export const StyledSettingsItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.875rem;

    &:not(:last-child) {
        margin-bottom: 1rem;
    }

    @media ${VIEWPORT.TABLET} {
        padding: 0.875rem;
        border-bottom: 1px solid var(--mnw-color-9);
        background-color: var(--mnw-color-8);

        &:not(:last-child) {
            margin-bottom: 0;
        }
    }
`;

export const StyledTitle = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
`;

export const StyledIcon = styled.div`
    margin-right: 1rem;
`;
