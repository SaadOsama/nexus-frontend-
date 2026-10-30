export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    changePassword: "/auth/change-password",
  },
  projects: {
    list: "/projects",       // browse ALL projects, flagged with isOwner/hasRequested
    mine: "/projects/mine",  // only the logged-in user's own projects
    create: "/projects",
  },
  collaborations: {
    request: "/collaborations/request",
    incoming: "/collaborations/incoming", // GET (no :userId needed anymore — backend uses the token)
    accept: "/collaborations/accept",
    dismiss: "/collaborations/dismiss",
  },
};
