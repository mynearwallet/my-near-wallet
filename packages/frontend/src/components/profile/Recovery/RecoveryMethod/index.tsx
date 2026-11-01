import React from 'react';
import { Translate } from 'react-localize-redux';

import { Container, Description, Main, Title, TitleWrapper } from './ui';
import FormButton from '../../../common/FormButton';
import SkeletonLoading from '../../../common/SkeletonLoading';

const RecoveryMethod = ({
    title,
    description,
    skeleton,
    methodEnabled,
    onEnable,
    onDisable,
    children,
}: {
    title: string;
    description?: string;
    skeleton?: any;
    methodEnabled: boolean;
    /** Leave out to show the method's state without the action. */
    onEnable?: () => void;
    onDisable?: () => void;
    children?: React.Component;
}) => {
    if (skeleton) {
        // @ts-ignore
        return <SkeletonLoading height={skeleton} show />;
    }

    const onClick = methodEnabled ? onDisable : onEnable;

    return (
        <Container>
            <Main>
                <TitleWrapper>
                    <Title>{title}</Title>
                </TitleWrapper>
                {onClick && (
                    <FormButton
                        {...{
                            type: 'submit',
                            color: methodEnabled ? 'gray-red small' : 'blue small',
                            onClick,
                        }}
                    >
                        <Translate
                            id={methodEnabled ? 'button.disable' : 'button.enable'}
                        />
                    </FormButton>
                )}
            </Main>
            {description && <Description>{description}</Description>}
            <>{children}</>
        </Container>
    );
};

export default RecoveryMethod;
