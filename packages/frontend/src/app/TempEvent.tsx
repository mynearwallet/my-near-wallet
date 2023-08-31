import { Dialog, Transition } from '@headlessui/react';
import React from 'react';
import { useSelector } from 'react-redux';

import tempEventImage from '../images/temp-event.jpeg';
import { selectAvailableAccounts } from '../redux/slices/availableAccounts';
import { useSoulboundTokens } from '../utils/query/src';

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Transition appear show={open} as={React.Fragment}>
            <Dialog
                as='div'
                className='fixed inset-0 z-50 overflow-y-auto'
                onClose={onClose}
            >
                <div className='min-h-screen px-4 text-center'>
                    <Transition.Child
                        as={React.Fragment}
                        enter='ease-out duration-300'
                        enterFrom='opacity-0'
                        enterTo='opacity-100'
                        leave='ease-in duration-200'
                        leaveFrom='opacity-100'
                        leaveTo='opacity-0'
                    >
                        <Dialog.Overlay className='fixed inset-0 bg-gray-600 opacity-50' />
                    </Transition.Child>

                    {/* This element is to trick the browser into centering the modal contents. */}
                    <span
                        className='inline-block h-screen align-middle'
                        aria-hidden='true'
                    >
                        &#8203;
                    </span>
                    <Transition.Child
                        as={React.Fragment}
                        enter='ease-out duration-300'
                        enterFrom='opacity-0 scale-95'
                        enterTo='opacity-100 scale-100'
                        leave='ease-in duration-200'
                        leaveFrom='opacity-100 scale-100'
                        leaveTo='opacity-0 scale-95'
                    >
                        <div className='inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl'>
                            <Dialog.Title
                                as='h3'
                                className='text-3xl text-center font-medium leading-6 text-gray-600'
                            >
                                NDC voting is coming!
                            </Dialog.Title>
                            <img
                                className='w-full mt-6 rounded-3xl'
                                src={tempEventImage}
                                alt='NDC voting event'
                            />
                            <span className='text-gray-400 text-lg mt-4 block'>
                                The NEAR Digital Collective (NDC) is all about giving
                                everyone a say in the NEAR network's future. It's about
                                transparency, collective decisions, and
                                self-determination. Our first elections are coming up, so
                                register as a voter before September 1, 23:59 UTC via
                                I-AM-HUMAN. Make your voice count!
                            </span>
                            <div className='flex flex-row-reverse mt-4'>
                                <button
                                    onClick={() => window.open('https://i-am-human.app/')}
                                    className='block text-lg p-4 bg-gradient-to-tr from-[#a0d4fc] via-[#5cc5f2] via-40% to-[#cc92ff] text-white font-bold rounded-full'
                                >
                                    Register as a voter now!
                                </button>
                                <button
                                    onClick={onClose}
                                    className='block text-lg p-4 text-gray-500 hover:text-gray-900'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function TempEvent() {
    const [modal, setModal] = React.useState<boolean>(false);
    const [ignore, setIgnore] = React.useState<boolean>(false);
    const availableAccounts = useSelector(selectAvailableAccounts);
    const { data: soulboundTokens } = useSoulboundTokens(availableAccounts);

    React.useEffect(() => {
        console.log('Soulbound Tokens', soulboundTokens);

        if (Date.now() > Date.UTC(2023, 8, 1, 23, 59, 59)) {
            return;
        }

        if (!soulboundTokens) {
            return;
        }

        if (!availableAccounts) {
            return;
        }

        if (availableAccounts.length === 0) {
            return;
        }

        if (soulboundTokens.length === 0) {
            setModal(true);
        }
    }, [soulboundTokens]);

    const onClose = React.useCallback(() => {
        setModal(false);
        setIgnore(true);
    }, []);

    return <Modal open={modal && !ignore} onClose={onClose} />;
}
