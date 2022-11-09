import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import FormButton from '../../../common/FormButton';
import SkeletonLoading from '../../../common/SkeletonLoading';
import { Container, Description, Main, Title, TitleWrapper, StyledButtons } from './ui';

type RecoveryMethodProps = {
    title: string;
    description: React.ReactElement | string;
    skeleton?: string;
    methodEnabled: boolean;
    canDisable?: boolean;
    onEnable: VoidFunction;
    onDisable: VoidFunction;
    onChange?: VoidFunction;
}

const RecoveryMethod: FC<RecoveryMethodProps> = ({
    title,
    description,
    skeleton,
    methodEnabled,
    canDisable,
    onEnable,
    onDisable,
    onChange,
}) => {
    const { t } = useTranslation();

    const areManyButtons = Boolean((onDisable || onEnable) && onChange);

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
            <Main isColumn={areManyButtons}>
                <TitleWrapper>
                    <Title>{title}</Title>
                </TitleWrapper>

                <StyledButtons areManyButtons={areManyButtons}>
                    <FormButton
                        /*@ts-ignore*/
                        type='submit'
                        color={methodEnabled ? 'gray-red small' : 'blue small'}
                        onClick={methodEnabled ? onDisable : onEnable}
                    >
                        {t(methodEnabled ? 'button.disable' : 'button.enable')}
                    </FormButton>
                    {methodEnabled && onChange && (
                        <FormButton
                            type='submit'
                            color="light-gray-blue small"
                            onClick={onChange}
                        >
                            {t('button.change')}
                        </FormButton>
                    )}
                </StyledButtons>
            </Main>
            {description && (<Description>{description}</Description>)}
        </Container>
    );
};

export default RecoveryMethod;
