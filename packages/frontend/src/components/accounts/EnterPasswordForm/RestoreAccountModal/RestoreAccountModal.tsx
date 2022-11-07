import React, {FC, useState} from 'react';
import { useTranslation } from 'react-i18next';

import { currentTargetChecked } from '../../../../shared/lib/forms/selectors';
import Checkbox from '../../../common/Checkbox';
import FormButton from '../../../common/FormButton';
import { Title } from '../ui';
import { Buttons, CheckboxCaption, Description, Label } from './ui';

type RestoreAccountModalProps = {
    onSubmit: VoidFunction;
    onCancel: VoidFunction;
}

const RestoreAccountModal: FC<RestoreAccountModalProps> = ({
    onSubmit,
    onCancel
}) => {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);

    return (
        <>
            <Title>
                {t('restoreAccountModal.title')}
            </Title>
            <Description>
                {t('restoreAccountModal.description')}
            </Description>

            <Label>
                <Checkbox
                    checked={checked}
                    onChange={currentTargetChecked(setChecked)} />
                <CheckboxCaption>
                    {t('restoreAccountModal.checkboxCaption')}
                </CheckboxCaption>
            </Label>
            <Buttons>
                <FormButton
                    disabled={!checked}
                    onClick={onSubmit}
                    color='blue'
                >
                    {t('restoreAccountModal.submitCaption')}
                </FormButton>
                <FormButton
                    onClick={onCancel}
                    className='link'
                    color='gray'
                >
                    {t('restoreAccountModal.cancelCaption')}
                </FormButton>
            </Buttons>
        </>
    );
};

export default RestoreAccountModal;
