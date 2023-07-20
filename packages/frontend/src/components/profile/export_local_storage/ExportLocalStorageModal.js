import React from 'react';
import { Translate } from 'react-localize-redux';
import styled from 'styled-components';

import CheckMarkNoBorderIcon from '../../../images/icon-check-no-border.svg';
import { exportData } from '../../../utils/import-export';
import FormButton from '../../common/FormButton';
import Modal from '../../common/modal/Modal';

const Container = styled.div`
    &&&&& {
        padding: 15px 0 10px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        h3 {
            margin: 15px 0;
            font-size: 18px;
            font-weight: 700;
        }

        p {
            line-height: 1.5;
            font-size: 14px;
        }

        label {
            text-align: left;
            display: flex;
            background-color: #f5faff;
            margin: 25px -25px 0 -25px;
            padding: 15px 25px;
            line-height: 1.5;

            > div {
                > div {
                    border-color: #0081f1;
                }
            }

            > span {
                margin-left: 10px;
                word-break: break-word;
                color: #006adc;
            }

            b {
                color: #272729;
            }
        }

        > button {
            margin-top: 32px;
            width: 100%;
        }

        .link {
            margin-top: 20px;
        }

        .text-select-display {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            padding: 20px;

            background: #272729;
            border-radius: 8px;

            word-break: break-word;
            text-align: left;
        }

        input.success {
            background: url(${CheckMarkNoBorderIcon}) no-repeat right;
            background-position: 97%;
        }

        form {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            > button {
                margin-top: 32px;
                width: 100%;
            }

            .link {
                margin-top: 20px;
            }
        }
    }
`;

function download() {
    const element = document.createElement('a');
    const exportString = exportData();

    element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(exportString)
    );
    element.setAttribute('download', `MyNearWallet-export-${Date.now()}.txt`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export default ({ isOpen, onClose }) => {
    return (
        <Modal id='remove-account-modal' isOpen={isOpen} onClose={onClose} modalSize='sm'>
            <Container>
                <h3>
                    <Translate id='exportLocalStorage.title' />
                </h3>
                <p>
                    <Translate id='exportLocalStorage.desc' />
                </p>
                <FormButton onClick={download}>
                    <Translate id='exportLocalStorage.download' />
                </FormButton>
                <FormButton onClick={onClose}>
                    <Translate id='button.dismiss' />
                </FormButton>
            </Container>
        </Modal>
    );
};
