import { combineReducers } from '@reduxjs/toolkit';

import tokensMetadataSlice from '../slices/tokensMetadata';

export default {
    shared: combineReducers({
        [tokensMetadataSlice.name]: tokensMetadataSlice.reducer,
    }),
};
