import styled from 'styled-components';

const Breakdown = styled.div`
    background-color: #fafafa;
    border-radius: 8px;

    > div {
        :first-of-type {
            color: #272729;
        }
    }

    .breakdown {
        background-color: #f0f0f1;

        > div {
            > div {
                border-bottom: 1px solid #e5e5e6;

                :last-of-type {
                    border-bottom: 0;
                }
            }
        }
    }
`;

export default Breakdown;
