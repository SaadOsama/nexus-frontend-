import { createSlice } from '@reduxjs/toolkit';

const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('nexus_user'));
  } catch {
    return null;
  }
})();

const initialState = {
  user: storedUser || null,
  token: localStorage.getItem('nexus_token') || null,
  isAuthenticated: !!localStorage.getItem('nexus_token'),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;

      if (token) localStorage.setItem('nexus_token', token);
      if (refreshToken) localStorage.setItem('nexus_refresh_token', refreshToken);
      if (user) localStorage.setItem('nexus_user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_refresh_token');
      localStorage.removeItem('nexus_user');
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;
export default userSlice.reducer;
