import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myProjects: [],
  browseProjects: [],
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setMyProjects: (state, action) => {
      state.myProjects = action.payload;
    },
    setBrowseProjects: (state, action) => {
      state.browseProjects = action.payload;
    },
    projectPublished: (state, action) => {
      state.myProjects.unshift(action.payload);
    },
  },
});

export const { setMyProjects, setBrowseProjects, projectPublished } = projectSlice.actions;
export default projectSlice.reducer;