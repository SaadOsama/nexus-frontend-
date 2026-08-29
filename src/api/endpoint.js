export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    changePassword: "/auth/change-password",
  },
  projects: {
    list: "/projects/browse",
    mine: "/projects/mine",
    create: "/projects/publish",
  },
  collaborations: {
    list: "/collaborations",
    send: "/collaborations/send",
    accept: "/collaborations/accept",
    dismiss: "/collaborations/dismiss",
  },
};