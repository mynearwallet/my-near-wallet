import React, { FC } from 'react';
import { Translate } from 'react-localize-redux';

import {
    getLevelsFromComplexity,
    PasswordComplexity
} from './lib/complexity';
import { Content, Level, Wrapper, Description, LevelWrapper } from './ui';

type ComplexityBlockProps = {
    show: boolean;
    complexity: PasswordComplexity;
}

export const renderComplexityTrans = (
    complexity: PasswordComplexity
): React.ReactElement => {
    switch (complexity) {
        case 'none':
            return null;
        case 'week':
            return <Translate id='setupPasswordProtection.week' />;
        case 'average':
            return <Translate id='setupPasswordProtection.average' />;
        case 'strong': <Translate id='setupPasswordProtection.strong' />;
    }
};

const ComplexityBlock: FC<ComplexityBlockProps> = (props) => {
    const levels = getLevelsFromComplexity(props.complexity);

    return (
        <Wrapper show={props.show}>
            <Content>
                <LevelWrapper>
                    {
                        Array(levels).fill(undefined).map((_, index) =>
                            <Level level={index + 1} />
                        )
                    }
                </LevelWrapper>
                <Description>
                    {renderComplexityTrans(props.complexity)}
                </Description>
            </Content>
        </Wrapper>
    );
};

export default ComplexityBlock;
