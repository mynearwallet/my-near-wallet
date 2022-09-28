import React from 'react';

import FormButton from '../../../components/common/FormButton';

const swapStyle = {
    margin: '0',
    height: '44px',
};

/* 
    flip {
        width: 4.5rem;
        background-color: #E1F0FF;

        svg {
            width: initial !important;
            height: initial !important;
            margin: initial !important;
        }

        :hover {
            background-color: var(--color-1);

            svg {
                path {
                    fill: #ffffff;
                }
            }
        }
    }
*/

export default function SwapButton({ children, low, flip, ...restProps }) {
    const style = low ? swapStyle : undefined;

    return (
        <FormButton style={style} {...restProps}>
            {children}
        </FormButton>
    );
}
