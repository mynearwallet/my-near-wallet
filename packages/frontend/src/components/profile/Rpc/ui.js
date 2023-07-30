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

export const ModalTitle = styled.div`
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 800;
    margin-bottom: 20px;
`;

export const ModalBody = styled.div`
    font-size: 1rem;
    line-height: 1.5rem;
    margin-bottom: 20px;
`;

export const RpcSelect = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
`;

export const RpcPill = styled.div`
    &.active {
        background-color: rgb(3 105 161);
        color: rgb(249 250 251);
    }
    :hover {
        background-color: rgb(14 165 233);
        color: rgb(249 250 251);
    }
    cursor: pointer;
    margin-bottom: 10px;
    background-color: rgb(226 232 240);
    margin-right: 10px;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;
    font-size: 1rem;
    line-height: 1.5rem;
    border-radius: 999px;
`;
