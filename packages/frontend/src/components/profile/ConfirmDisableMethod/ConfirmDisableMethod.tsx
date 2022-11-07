import React, {FC, useCallback, useState} from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectAccountId } from '../../../redux/slices/account';
import isMobile from '../../../utils/isMobile';
import FormButton from '../../common/FormButton';
import Modal from '../../common/modal/Modal';
import { Container, Description, Title } from './ui';

type ConfirmDisableMethodProps = {
    title: string;
    description: string;
    isOpen: boolean;
    isProcessing: boolean;
    onClose: VoidFunction;
    onSubmit: VoidFunction;
}

const ConfirmDisableMethod: FC<ConfirmDisableMethodProps> = ({
    title,
    description,
    isOpen,
    isProcessing,
    onClose,
    onSubmit
}) => {
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const onChangeHandler = useCallback((e) => {
        setValue(e.target.value);
    }, [setValue]);

    const accountId = useSelector(selectAccountId);
    const accountIdConfirmed = accountId === value;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            modalSize='sm'
        >
            <Container>
                <Title>{title}</Title>
                <Description>{description}</Description>
                <input
                    placeholder={t('recoveryMgmt.disableInputPlaceholder')}
                    onChange={onChangeHandler}
                    value={value}
                    autoCapitalize='off'
                    spellCheck='false'
                    autoFocus={!isMobile()}
                />
                <FormButton
                    color='red'
                    type='submit'
                    sendingString='button.disabling'
                    sending={isProcessing}
                    disabled={!accountIdConfirmed}
                    onClick={onSubmit}
                >
                    {t('button.disable')}
                </FormButton>
                <FormButton
                    className='link'
                    onClick={onClose}>
                    {t('button.cancel')}
                </FormButton>
            </Container>
        </Modal>
    );
};

export default ConfirmDisableMethod;
