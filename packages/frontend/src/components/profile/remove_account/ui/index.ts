import styled from 'styled-components';

import Container from '../../../common/styled/Container.css';

export const StyledRemoveAccount = styled(Container)`
    margin-top: 16px;
    padding-top: 0;
    padding-bottom: 0;

    &&& {
        > button {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;

            svg {
                width: 22px;
                height: 22px;
                margin-right: 10px;
            }

            :hover {
                > svg {
                    path {
                        stroke: var(--mnw-color-error-2);
                    }
                }
            }
        }
    }
`;

