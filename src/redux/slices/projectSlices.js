import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myProjects: [],
  myProjectsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    limit: 6,
    hasNextPage: false,
    hasPrevPage: false,
  },
  browseProjects: [],
  browseProjectsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    limit: 6,
    hasNextPage: false,
    hasPrevPage: false,
  },
  isLoading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Set My Projects & Pagination
    setMyProjects: (state, action) => {
      state.myProjects = action.payload;
    },
    setMyProjectsPagination: (state, action) => {
      state.myProjectsPagination = action.payload;
    },

    // Set Browse Projects & Pagination
    setBrowseProjects: (state, action) => {
      state.browseProjects = action.payload;
    },
    setBrowseProjectsPagination: (state, action) => {
      state.browseProjectsPagination = action.payload;
    },

    // Add Newly Published Project directly to state
    projectPublished: (state, action) => {
      state.myProjects.unshift(action.payload);
      state.myProjectsPagination.totalProjects += 1;
    },

    // Loading & Error Handlers
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Reset All State (e.g. on Logout)
    resetProjectState: () => initialState,
  },
});

export const {
  setMyProjects,
  setMyProjectsPagination,
  setBrowseProjects,
  setBrowseProjectsPagination,
  projectPublished,
  setLoading,
  setError,
  resetProjectState,
} = projectSlice.actions;

export default projectSlice.reducer;