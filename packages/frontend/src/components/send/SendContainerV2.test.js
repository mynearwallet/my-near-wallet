import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

import SendContainerV2, { VIEWS } from './SendContainerV2';

jest.mock('./components/views/EnterAmount', () => () => null);
jest.mock('./components/views/EnterReceiver', () => () => null);
jest.mock('./components/views/Review', () => () => null);
jest.mock('./components/views/SelectToken', () => () => null);
jest.mock('./components/views/Success', () => () => null);
jest.mock('../../mixpanel/index', () => ({ Mixpanel: { track: jest.fn() } }));
jest.mock('../../services/FungibleTokens', () => ({
    getFormattedTokenAmount: jest.fn(),
    getParsedTokenAmount: jest.fn(() => '0'),
    getUniqueTokenIdentity: (token) => token.contractName,
}));
jest.mock('../common/balance/helpers', () => ({ getNearAndFiatValue: jest.fn() }));

const nearToken = {
    balance: '1000000000000000000000000',
    contractName: 'NEAR',
    onChainFTMetadata: { decimals: 24, symbol: 'NEAR' },
};

const props = {
    accountId: 'sender.near',
    accountIdFromUrl: '',
    activeView: VIEWS.ENTER_AMOUNT,
    checkAccountAvailable: jest.fn(),
    clearLocalAlert: jest.fn(),
    estimatedTotalFees: '0',
    estimatedTotalInNear: '0',
    explorerUrl: '',
    fungibleTokens: [nearToken],
    handleContinueToReview: jest.fn(),
    handleSendToken: jest.fn(),
    isMobile: false,
    localAlert: null,
    nearTokenFiatValueUSD: 0,
    redirectTo: jest.fn(),
    sendingToken: false,
    setActiveView: jest.fn(),
    showNetworkBanner: false,
    transactionHash: null,
};

describe('SendContainerV2', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        window.scrollTo = jest.fn(() => ({ not: 'a cleanup function' }));
    });

    afterEach(() => {
        act(() => {
            ReactDOM.unmountComponentAtNode(container);
        });
        container.remove();
    });

    test('does not use the scroll result as an effect cleanup function', () => {
        act(() => {
            ReactDOM.render(<SendContainerV2 {...props} />, container);
        });

        expect(() => {
            act(() => {
                ReactDOM.render(
                    <SendContainerV2 {...props} activeView={VIEWS.SELECT_TOKEN} />,
                    container
                );
            });
        }).not.toThrow();
    });
});
