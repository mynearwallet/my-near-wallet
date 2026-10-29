import { parse } from 'query-string';

// The real helper pulls in the wallet config; this is its exact protocol rule.
jest.mock('../../utils/helper-api', () => ({
    isUrlNotJavascriptProtocol: (url) => {
        if (!url) {
            return true;
        }
        try {
            return !['javascript:', 'data:', 'blob:', 'vbscript:'].includes(
                new URL(url).protocol
            );
        } catch {
            return false;
        }
    },
}));

// eslint-disable-next-line import/first
import {
    POPUP_FALLBACK_REDIRECT_MS,
    readDappRequest,
    sendLoginFailure,
    sendSignFailure,
    sendSignMessageFailure,
    sendVerifyOwnerFailure,
} from './dappFailure';
// eslint-disable-next-line import/first
import { initialGateStatus } from './existingAccountGateStatus';

const redirectedTo = (dispatch) =>
    dispatch.mock.calls
        .map(([action]) => action)
        .filter((action) => action.type === 'externalRedirect/showExternalRedirect')
        .map((action) => action.payload);

const queryOf = (url) => parse(new URL(url).search);

describe('dApp failure answers', () => {
    afterEach(() => {
        delete window.opener;
        jest.useRealTimers();
    });

    it('refuses to answer to a missing or script callback', () => {
        const dispatch = jest.fn();
        expect(sendLoginFailure({ dispatch, failureUrl: undefined })).toBe(false);
        expect(sendLoginFailure({ dispatch, failureUrl: 'javascript:alert(1)' })).toBe(
            false
        );
        expect(sendSignFailure({ dispatch, callbackUrl: 'data:text/html,hi' })).toBe(
            false
        );
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('redirects a redirect-mode login to failure_url', () => {
        const dispatch = jest.fn();
        expect(
            sendLoginFailure({
                dispatch,
                failureUrl: 'https://app.example/login?failed=1',
            })
        ).toBe(true);
        expect(redirectedTo(dispatch)).toEqual(['https://app.example/login?failed=1']);
    });

    it('posts to the opener in popup mode, then falls back to the redirect', () => {
        jest.useFakeTimers();
        const postMessage = jest.fn();
        window.opener = { postMessage };
        const dispatch = jest.fn();

        sendLoginFailure({
            dispatch,
            failureUrl: 'https://app.example/cb',
            errorMessage: 'Retired',
        });

        expect(postMessage).toHaveBeenCalledWith(
            { status: 'failure', errorCode: 'USER_CANCELLED', errorMessage: 'Retired' },
            'https://app.example/cb'
        );
        expect(dispatch).not.toHaveBeenCalled();
        jest.advanceTimersByTime(POPUP_FALLBACK_REDIRECT_MS);
        expect(redirectedTo(dispatch)).toEqual(['https://app.example/cb']);
    });

    it('encodes the sign failure exactly once', () => {
        const dispatch = jest.fn();
        sendSignFailure({
            dispatch,
            callbackUrl: 'https://app.example/sign',
            signMeta: 'meta 1',
            errorMessage: 'No longer available & retired',
        });
        const [url] = redirectedTo(dispatch);
        expect(queryOf(url)).toEqual({
            signMeta: 'meta 1',
            errorCode: 'userRejected',
            errorMessage: 'No longer available & retired',
        });
    });

    it('answers sign-message with a failure status in popup mode', () => {
        const postMessage = jest.fn();
        window.opener = { postMessage };
        sendSignMessageFailure({
            dispatch: jest.fn(),
            callbackUrl: 'https://app.example/',
            errorMessage: 'Retired',
        });
        expect(postMessage).toHaveBeenCalledWith(
            { status: 'failure', errorMessage: 'Retired' },
            'https://app.example'
        );
    });

    it('answers verify-owner by redirect only, even with an opener', () => {
        const postMessage = jest.fn();
        window.opener = { postMessage };
        const dispatch = jest.fn();
        sendVerifyOwnerFailure({
            dispatch,
            callbackUrl: 'https://app.example/verify',
            meta: 'm',
            errorMessage: 'Retired',
        });
        expect(postMessage).not.toHaveBeenCalled();
        expect(queryOf(redirectedTo(dispatch)[0])).toEqual({
            meta: 'm',
            error: 'Retired',
        });
    });
});

describe('readDappRequest', () => {
    it('reads the login failure_url as the callback', () => {
        expect(
            readDappRequest(
                'login',
                '?contract_id=app.near&public_key=ed25519:abc&success_url=https%3A%2F%2Fapp.example%2Fok&failure_url=https%3A%2F%2Fapp.example%2Ffail'
            )
        ).toEqual({
            callbackUrl: 'https://app.example/fail',
            hostUrl: 'https://app.example/fail',
            isCli: false,
        });
    });

    it('recognises a NEAR CLI login (loopback success_url, no contract, no failure_url)', () => {
        expect(
            readDappRequest(
                'login',
                '?public_key=ed25519:abc&success_url=http%3A%2F%2F127.0.0.1%3A5000'
            )
        ).toMatchObject({ callbackUrl: undefined, isCli: true });
    });

    it('reads callbackUrl and meta for signing requests', () => {
        expect(
            readDappRequest(
                'sign',
                '?transactions=abc&callbackUrl=https%3A%2F%2Fapp.example%2Fsigned&meta=xyz'
            )
        ).toEqual({
            callbackUrl: 'https://app.example/signed',
            hostUrl: 'https://app.example/signed',
            meta: 'xyz',
            isCli: false,
        });
    });
});

describe('ExistingAccountGate initial status', () => {
    it('lets everything through while creation is still allowed', () => {
        expect(
            initialGateStatus({
                creationRetired: false,
                isActiveAccount: false,
                isFundedCreation: true,
            })
        ).toBe('existing');
    });

    it('lets the user’s own account through without asking the chain', () => {
        expect(
            initialGateStatus({
                creationRetired: true,
                isActiveAccount: true,
                isFundedCreation: false,
            })
        ).toBe('existing');
    });

    it('treats linkdrop and trial funding as creation', () => {
        expect(
            initialGateStatus({
                creationRetired: true,
                isActiveAccount: true,
                isFundedCreation: true,
            })
        ).toBe('new');
    });

    it('asks the chain about any other account', () => {
        expect(
            initialGateStatus({
                creationRetired: true,
                isActiveAccount: false,
                isFundedCreation: false,
            })
        ).toBe('checking');
    });
});
