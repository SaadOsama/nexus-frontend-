import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlices';
import projectReducer from './projectSlices';

export const store = configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer,
  },
});


