import React, { FC } from 'react';

import { Wrapper, Animation } from './ui';

type SkeletonLoadingProps = {
    className?: string;
    height: string;
    padding?: string;
    number?: number;
    show: boolean;
}

const SkeletonLoading: FC<SkeletonLoadingProps> = ({
    height,
    padding,
    number = 1,
    show,
    className
}) => {
    if (show) {
        return (
            <>
                {
                    Array(number).fill(undefined).map((_, i) => (
                        <div className={className} style={{ padding }} key={i}>
                            <Wrapper className='animation-wrapper' style={{ height }}>
                                <Animation className='animation'/>
                            </Wrapper>
                        </div>
                    ))

                }
            </>
        );
    }

    return null;
};

export default SkeletonLoading;
