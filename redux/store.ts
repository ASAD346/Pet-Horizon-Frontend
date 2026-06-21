import { applyMiddleware, createStore } from 'redux';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { thunk, type ThunkDispatch } from 'redux-thunk';
import type { AppAction, AppThunk } from './action';
import { rootReducer } from './reducer';
import type { AppState } from './types';

export const store = createStore(rootReducer, applyMiddleware(thunk));

export type AppDispatch = ThunkDispatch<AppState, unknown, AppAction>;
export type { AppThunk };

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
