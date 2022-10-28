import styled from 'styled-components';

export const StyledNavigation = styled.nav`
    position: absolute;
    left: 0;
    top: 0;
    padding: 0.75rem;
    width: 240px;
    height: 100vh;
    background-color: var(--mnw-component-background-1);
    /* TODO: ask about design. This border is for splitting between desktop navigation and main zone.
        Keep just a border for the first iteration?
    */
    border/* -right */: 1px solid #a2b3ca;

    @media (max-width: 991px) {
        padding-left: 0;
        width: 100%;
        height: 70px;
        position: relative;
        padding: 0 14px;
        transition: 300ms;
        border-bottom: 1px solid #f0f0f1;
    }
`;

export const StyledHeader = styled.header``;

export const StyledLinks = styled.ul``;

export const StyledNavItem = styled.li``;

export const StyledFooter = styled.div``;

export const StyledDivider = styled.hr`
    opacity: 0.5;
`;
