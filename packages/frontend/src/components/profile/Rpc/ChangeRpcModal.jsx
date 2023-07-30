import React from 'react';

import { rpcList } from '../../../utils/mnw-api-js';
import Modal from '../../common/modal/Modal';
import { ModalTitle, ModalBody, RpcSelect, RpcPill } from './ui';

export default function ChangeRpcModal({ onClose, rpcProvider, setRpcProvider }) {
    return (
        <Modal id='change-rpc-modal' onClose={onClose} modalSize='lg'>
            <ModalTitle>Change RPC Provider</ModalTitle>
            <ModalBody>
                The chosen RPC provider will be the default RPC provider used to connect
                to NEAR blockchain. When the default RPC provider fails, the system will
                use other RPC provider as fallback options.
            </ModalBody>
            <RpcSelect>
                {rpcList.map((rpcInfo) => (
                    <RpcPill
                        key={rpcInfo.url}
                        className={rpcInfo.url === rpcProvider ? 'active' : ''}
                        onClick={() => setRpcProvider(rpcInfo.url)}
                    >
                        {rpcInfo.name}
                    </RpcPill>
                ))}
            </RpcSelect>
            <ModalBody>{rpcProvider}</ModalBody>
        </Modal>
    );
}
