import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import api from "../axios/index";
import { API_ENDPOINTS } from "../endpoints/index";
import { loginSuccess } from "../../redux/slices/userSlice";

export function useLogin(options = {}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    mutate:      userLogin,
    mutateAsync: userLoginAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.auth.login, data),
    onSuccess: (response) => {
      const data = response?.data?.data;
      dispatch(loginSuccess({
        user:         data?.user         ?? data,
        token:        data?.token        ?? null,
        refreshToken: data?.refreshToken ?? null,
      }));
      navigate("/");
    },
    onError: (err) => {
      console.log("Login error:", err);
    },
    ...options,
  });

  return {
    userLogin,
    userLoginAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error: error?.response?.data?.message || error?.message,
    data,
  };
}

// ── useRegister ────────────────────────────────────────────────
export function useRegister(options = {}) {
  const {
    mutate:      addRegister,
    mutateAsync: addRegisterAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.auth.register, data),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Registration successful");
    },
    onError: (err) => {
      console.log("Register error:", err);
    },
    ...options,
  });

  return {
    addRegister,
    addRegisterAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error: error?.response?.data?.message || error?.message,
    data,
  };
}

// ── useForgotPassword ──────────────────────────────────────────
export function useForgotPassword(options = {}) {
  const {
    mutate:      sendForgotPassword,
    mutateAsync: sendForgotPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (email) => api.post(API_ENDPOINTS.auth.forgotPassword, { email }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Reset link sent to your email");
    },
    onError: (err) => {
      console.log("Forgot password error:", err);
    },
    ...options,
  });

  return {
    sendForgotPassword,
    sendForgotPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error: error?.response?.data?.message || error?.message,
    data,
  };
}

// ── useResetPassword ───────────────────────────────────────────
export function useResetPassword(options = {}) {
  const {
    mutate:      resetUserPassword,
    mutateAsync: resetUserPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: ({ token, newPassword }) =>
      api.post(API_ENDPOINTS.auth.resetPassword, { token, newPassword }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Password reset successfully");
    },
    onError: (err) => {
      console.log("Reset password error:", err);
    },
    ...options,
  });

  return {
    resetUserPassword,
    resetUserPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error: error?.response?.data?.message || error?.message,
    data,
  };
}

// ── useChangePassword ──────────────────────────────────────────
export function useChangePassword(options = {}) {
  const {
    mutate:      changeUserPassword,
    mutateAsync: changeUserPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: ({ oldPassword, newPassword }) =>
      api.patch(API_ENDPOINTS.auth.changePassword, { oldPassword, newPassword }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Password changed successfully");
    },
    onError: (err) => {
      console.log("Change password error:", err);
    },
    ...options,
  });

  return {
    changeUserPassword,
    changeUserPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error: error?.response?.data?.message || error?.message,
    data,
  };
}
