import React, { FC } from 'react';
import { Translate } from 'react-localize-redux';

import FormButton from '../../../common/FormButton';
import SkeletonLoading from '../../../common/SkeletonLoading';
import { Container, Description, Main, Title, TitleWrapper } from './ui';

type RecoveryMethodProps = {
    title: string;
    description: React.ReactElement | string;
    skeleton?: string;
    methodEnabled: boolean;
    canDisable?: boolean;
    onEnable: VoidFunction;
    onDisable: VoidFunction;
}

const RecoveryMethod: FC<RecoveryMethodProps> = ({
    title,
    description,
    skeleton,
    methodEnabled,
    canDisable,
    onEnable,
    onDisable
}) => {
    if (skeleton) {
        return (
            <SkeletonLoading
                height={skeleton}
                show
            />
        );
    }

    return (
        <Container>
            <Main>
                <TitleWrapper>
                    <Title>{title}</Title>
                </TitleWrapper>
                <FormButton
                    /*@ts-ignore*/
                    type='submit'
                    color={methodEnabled ? 'gray-red small' : 'blue small'}
                    onClick={methodEnabled ? onDisable : onEnable}
                >
                    <Translate id={methodEnabled ? 'button.disable' : 'button.enable' }/>
                </FormButton>
            </Main>
            {description && (<Description>{description}</Description>)}
        </Container>
    );
};

export default RecoveryMethod;
