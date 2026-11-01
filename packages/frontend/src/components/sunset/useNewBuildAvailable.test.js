import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, useHistory } from 'react-router-dom';

jest.mock('../../config', () => ({ __esModule: true, default: {} }));

// eslint-disable-next-line import/first
import useNewBuildAvailable, { isNewBuildDeployed } from './useNewBuildAvailable';

describe('isNewBuildDeployed', () => {
    it('compares the running build with the deployed one', () => {
        expect(isNewBuildDeployed('a', 'b')).toBe(true);
        expect(isNewBuildDeployed('a', 'a')).toBe(false);
    });

    it('never prompts without both ids', () => {
        // The dev server has no build id, and an older deployment has no version.json.
        expect(isNewBuildDeployed(undefined, 'b')).toBe(false);
        expect(isNewBuildDeployed('a', null)).toBe(false);
    });
});

describe('useNewBuildAvailable', () => {
    let container;
    let history;
    let isAvailable;

    function Probe({ buildId }) {
        history = useHistory();
        isAvailable = useNewBuildAvailable({ buildId });
        return null;
    }

    const render = (buildId = 'running') =>
        act(() => {
            ReactDOM.render(
                <MemoryRouter>
                    <Probe buildId={buildId} />
                </MemoryRouter>,
                container
            );
        });

    const deploy = (buildId) => {
        global.fetch = jest.fn(async () => ({
            ok: true,
            json: async () => ({ buildId }),
        }));
    };

    const settle = async () => {
        for (let i = 0; i < 5; i++) {
            await Promise.resolve();
        }
    };

    const navigateAfter = (millis, path) =>
        act(async () => {
            jest.advanceTimersByTime(millis);
            history.push(path);
            await settle();
        });

    beforeEach(() => {
        jest.useFakeTimers();
        container = document.createElement('div');
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(container);
        jest.useRealTimers();
        delete global.fetch;
    });

    it('waits a minute after load before the first check', async () => {
        deploy('newer');
        render();
        await navigateAfter(1000, '/staking');

        expect(global.fetch).not.toHaveBeenCalled();
        expect(isAvailable).toBe(false);
    });

    it('reports a newer deployment on the next page change', async () => {
        deploy('newer');
        render();
        await navigateAfter(61 * 1000, '/staking');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(isAvailable).toBe(true);
    });

    it('stays quiet while the same build is deployed', async () => {
        deploy('running');
        render();
        await navigateAfter(61 * 1000, '/staking');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(isAvailable).toBe(false);
    });

    it('checks a tab that stays on one page', async () => {
        deploy('newer');
        render();
        await act(async () => {
            jest.advanceTimersByTime(5 * 60 * 1000);
            await settle();
        });

        expect(isAvailable).toBe(true);
    });

    it('ignores a failed check and tries again later', async () => {
        global.fetch = jest.fn(async () => {
            throw new Error('offline');
        });
        render();
        await navigateAfter(61 * 1000, '/staking');
        expect(isAvailable).toBe(false);

        deploy('newer');
        await navigateAfter(61 * 1000, '/profile');
        expect(isAvailable).toBe(true);
    });

    it('does nothing without a build id', async () => {
        deploy('newer');
        render(null);
        await navigateAfter(61 * 1000, '/staking');

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
