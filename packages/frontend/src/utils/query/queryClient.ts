import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
    type PersistedClient,
    persistQueryClient,
} from '@tanstack/react-query-persist-client';
import { QueryClient } from '@tanstack/react-query';

/**
 * The persisted client, reduced to the queries marked `'persist'` in their key.
 *
 * They live in `clientState.queries`. This used to filter into a new top-level `queries` field
 * instead, which left `clientState` whole: every successful query in the cache was written to
 * localStorage (each token's `ft_metadata` with its inline icon, the full `validators` answer
 * twice over), filling the origin's storage until the Meteor transfer journal could not write.
 */
export const keepPersistMarkedQueries = (client: PersistedClient): PersistedClient => ({
    ...client,
    clientState: {
        ...client.clientState,
        queries: client.clientState.queries.filter((query) =>
            query.queryKey.includes('persist')
        ),
    },
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
});

persistQueryClient({
    queryClient,
    persister: {
        persistClient: async (client) => {
            await localStoragePersister.persistClient(keepPersistMarkedQueries(client));
        },
        restoreClient: localStoragePersister.restoreClient,
        removeClient: localStoragePersister.removeClient,
    },
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    // A buster that differs from the stored one makes restore delete the stored client. This one
    // retires every cache persisted before the filter above was fixed, on the first load after.
    buster: 'persist-marked-only',
});
