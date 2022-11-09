import styled from 'styled-components';

import Container from '../../common/styled/Container.css';

export const StyledContainer = styled(Container)`
    .input {
        width: 100%;
    }

    .input-sub-label {
        margin-bottom: 30px;
    }

    h4 {
        :first-of-type {
            margin: 30px 0 0 0 !important;
        }
    }

    button {
        width: 100% !important;
        margin-top: 30px !important;
    }
`;
