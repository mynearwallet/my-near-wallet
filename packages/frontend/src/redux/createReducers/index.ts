import { combineReducers } from 'redux';

import securityReducer, { SecurityState } from '../reducers/security';
import combinedMainReducers from './combinedMainReducers';
import combinedSharedReducers from './combinedSharedReducers';
import setupAccountReducer from './setupAccountReducer';

export type Action<T = undefined> = (payload?: T) => {
    type: string;
    payload?: T;
}

export interface StateAction<T, P = undefined> {
    type: T;
    payload: P;
}

type RootState = {[key: string]: any} & {
    security: SecurityState;
}

export default (history) => combineReducers<RootState>({
    ...combinedMainReducers(history),
    ...combinedSharedReducers,
    ...setupAccountReducer(),
    security: securityReducer,
});
