const mockCapture = jest.fn();

jest.mock('mixpanel-browser', () => ({
    init: jest.fn(),
}));
jest.mock('../config', () => ({ BROWSER_MIXPANEL_TOKEN: '' }));
jest.mock('../posthog', () => ({
    PostHog: {
        get_distinct_id: jest.fn(),
        identify: jest.fn(),
        alias: jest.fn(),
        capture: mockCapture,
        setPersonProperties: jest.fn(),
        setPersonPropertiesOnce: jest.fn(),
        register: jest.fn(),
    },
}));

// eslint-disable-next-line import/first
import { Mixpanel } from './index';

describe('analytics wrapper', () => {
    it('passes a deterministic insert id through to PostHog unchanged', () => {
        Mixpanel.track('wallet_migration_new_key_completed', {
            $insert_id: 'client-1',
        });

        expect(mockCapture).toHaveBeenCalledWith('wallet_migration_new_key_completed', {
            $insert_id: 'client-1',
        });
    });
});
