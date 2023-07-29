import styled from 'styled-components';

import FormButton from '../../common/FormButton';

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
`;

export const HeaderTitle = styled.div`
    font-weight: 700;
    color: #24272a;
`;

export const HeaderButton = styled(FormButton)`
    width: 100px !important;
    height: 36px !important;
    margin: 0 !important;
    padding: 0;
`;

export const BodyText = styled.div`
    margin-top: 16px;
    display: block;
    color: #a1a1a9;
`;
