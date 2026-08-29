import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlices.js';
import projectReducer from './projectSlices.js';

export const store = configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer,
  },
});

export default store;
