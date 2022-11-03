import styled from 'styled-components';

export const StyledNetworkBanner = styled.div`
    color: white;
    background-color: var(--mnw-color-1);
    position: fixed;
    padding: 10px;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    .tooltip {
        margin: 0 0 0 8px;
        svg {
            width: 18px;
            height: 18px;

            path {
                stroke: white;
            }
        }
    }

    .network-link {
        margin-left: 6px;
    }

    a {
        color: white;
        :hover {
            color: white;
            text-decoration: underline;
        }
    }

    &.staging-banner {
        background-color: var(--mnw-color-13);
        color: var(--mnw-color-14);

        .tooltip {
            svg {
                path {
                    stroke: var(--mnw-color-14);
                }
            }
        }

        .alert-triangle-icon {
            margin-right: 8px;
            min-width: 16px;
        }
    }
`;
