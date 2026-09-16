import { createSlice } from '@reduxjs/toolkit';
import { isTokenValid } from '@/token';

const getStoredUser = () => {
  try {
    const item = localStorage.getItem('nexus_user');
    return item && item !== 'undefined' ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const token = localStorage.getItem('nexus_token');
const hasValidToken = isTokenValid(token);

const initialState = {
  user: getStoredUser(),
  token: hasValidToken ? token : null,
  isAuthenticated: hasValidToken,

  // Badge counts state
  unreadMessagesCount: 0,
  pendingRequestsCount: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user || null;
      state.token = token || null;
      state.isAuthenticated = Boolean(token);

      if (token) localStorage.setItem('nexus_token', token);
      if (refreshToken) localStorage.setItem('nexus_refresh_token', refreshToken);
      if (user) localStorage.setItem('nexus_user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.unreadMessagesCount = 0;
      state.pendingRequestsCount = 0;

      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_refresh_token');
      localStorage.removeItem('nexus_user');
    },

    // BADGE REDUCERS
    setBadgeCounts: (state, action) => {
      const { unreadMessages, pendingRequests } = action.payload;
      if (typeof unreadMessages === 'number') state.unreadMessagesCount = unreadMessages;
      if (typeof pendingRequests === 'number') state.pendingRequestsCount = pendingRequests;
    },
    incrementUnreadMessages: (state) => {
      state.unreadMessagesCount += 1;
    },
    resetUnreadMessages: (state) => {
      state.unreadMessagesCount = 0;
    },
    incrementPendingRequests: (state) => {
      state.pendingRequestsCount += 1;
    },
    resetPendingRequests: (state) => {
      state.pendingRequestsCount = 0;
    },
  },
});

export const {
  loginSuccess,
  logout,
  setBadgeCounts,
  incrementUnreadMessages,
  resetUnreadMessages,
  incrementPendingRequests,
  resetPendingRequests,
} = userSlice.actions;

export default userSlice.reducer;