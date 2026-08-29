import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import api from "../axios";
import { API_ENDPOINTS } from "../endpoint";
import { loginSuccess } from "../../redux/slices/userSlices";

// IMPORTANT PATTERN used in every hook below:
// `useMutation({ ...options, onSuccess: (…) => { <our logic>; options.onSuccess?.(…) } })`
// Previously these hooks did `useMutation({ onSuccess: ourLogic, ...options })`.
// Because object spread lets a LATER key win, any `options.onSuccess` passed
// in by a component silently replaced `ourLogic` entirely — e.g. the Redux
// dispatch in useLogin would just never run if the screen using it passed
// its own onSuccess (which Login.jsx needs, to navigate by role). Spreading
// `options` first and composing `onSuccess` last fixes that.

export function useLogin(options = {}) {
  const dispatch = useDispatch();
  const { onSuccess: callerOnSuccess, onError: callerOnError, ...restOptions } = options;

  const {
    mutate: userLogin,
    mutateAsync: userLoginAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.auth.login, data),
    ...restOptions,
    onSuccess: (response, variables, context) => {
      // Backend returns a FLAT shape: { success, token, user } — not
      // nested under an extra "data" key. Reading response.data.data (as
      // before) always came back undefined, so login "succeeded" from the
      // network's point of view but never actually populated Redux.
      const payload = response?.data || {};
      dispatch(loginSuccess({
        user: payload.user ?? null,
        token: payload.token ?? null,
        refreshToken: payload.refreshToken ?? null,
      }));
      callerOnSuccess?.(response, variables, context);
    },
    onError: (err, variables, context) => {
      console.log("Login error:", err);
      callerOnError?.(err, variables, context);
    },
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

// ── useRegister ────────────────────────────────────────────
export function useRegister(options = {}) {
  const { onSuccess: callerOnSuccess, onError: callerOnError, ...restOptions } = options;

  const {
    mutate: addRegister,
    mutateAsync: addRegisterAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (data) => api.post(API_ENDPOINTS.auth.register, data),
    ...restOptions,
    onSuccess: (res, variables, context) => {
      toast.success(res?.data?.message || "Registration successful");
      callerOnSuccess?.(res, variables, context);
    },
    onError: (err, variables, context) => {
      console.log("Register error:", err);
      callerOnError?.(err, variables, context);
    },
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

// ── useForgotPassword ────────────────────────────────────────────
export function useForgotPassword(options = {}) {
  const { onSuccess: callerOnSuccess, onError: callerOnError, ...restOptions } = options;

  const {
    mutate: sendForgotPassword,
    mutateAsync: sendForgotPasswordAsync,
    isSuccess,
    isPending,
    isError,
    reset,
    error,
    data,
  } = useMutation({
    mutationFn: (email) => api.post(API_ENDPOINTS.auth.forgotPassword, { email }),
    ...restOptions,
    onSuccess: (res, variables, context) => {
      toast.success(res?.data?.message || "Reset link sent to your email");
      callerOnSuccess?.(res, variables, context);
    },
    onError: (err, variables, context) => {
      console.log("Forgot password error:", err);
      callerOnError?.(err, variables, context);
    },
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

// ── useResetPassword ────────────────────────────────────────────
export function useResetPassword(options = {}) {
  const { onSuccess: callerOnSuccess, onError: callerOnError, ...restOptions } = options;

  const {
    mutate: resetUserPassword,
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
    ...restOptions,
    onSuccess: (res, variables, context) => {
      toast.success(res?.data?.message || "Password reset successfully");
      callerOnSuccess?.(res, variables, context);
    },
    onError: (err, variables, context) => {
      console.log("Reset password error:", err);
      callerOnError?.(err, variables, context);
    },
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

// ── useChangePassword ────────────────────────────────────────────
export function useChangePassword(options = {}) {
  const { onSuccess: callerOnSuccess, onError: callerOnError, ...restOptions } = options;

  const {
    mutate: changeUserPassword,
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
    ...restOptions,
    onSuccess: (res, variables, context) => {
      toast.success(res?.data?.message || "Password changed successfully");
      callerOnSuccess?.(res, variables, context);
    },
    onError: (err, variables, context) => {
      console.log("Change password error:", err);
      callerOnError?.(err, variables, context);
    },
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
