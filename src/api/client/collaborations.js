import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../axios";
import { API_ENDPOINTS } from "../endpoint";

// 🟢 FIX: backend has no base GET '/' route anymore — closest equivalent
// is the admin pending list. Pointed here instead of a 404.
export function useGetCollaborationRequests(options = {}) {
  return useQuery({
    queryKey: ["collaborationRequests"],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.collaborations.list}/admin/pending`);
      return response.data?.data || [];
    },
    ...options,
  });
}

// Hook for User to fetch their sent collaboration requests
export function useGetMySentRequests(options = {}) {
  return useQuery({
    queryKey: ["mySentRequests"],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.collaborations.list}/my-requests`);
      return response.data?.data || [];
    },
    ...options,
  });
}

// Hook for Admin to fetch pending requests
export function useGetAdminPendingRequests(options = {}) {
  return useQuery({
    queryKey: ["adminPendingRequests"],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.collaborations.list}/admin/pending`);
      return response.data?.data || [];
    },
    ...options,
  });
}

export function useSendCollaborationRequest(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(API_ENDPOINTS.collaborations.send, payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Collaboration request sent for Admin approval");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySentRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
    ...options,
  });
}

// Hook for Admin Accept/Reject action with optional Admin Note/Response
export function useAdminCollaborationAction(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, adminNote }) =>
      api.post(`${API_ENDPOINTS.collaborations.list}/admin/action/${id}`, { action, adminNote }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Action updated");
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySentRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to perform action");
    },
    ...options,
  });
}

// 🟢 FIX: backend no longer exposes '/accept/:id' — re-pointed to the real
// '/admin/action/:id' route with action: 'approved', so this still works
// instead of 404ing.
export function useAcceptCollaboration(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(`${API_ENDPOINTS.collaborations.list}/admin/action/${id}`, {
        action: "approved",
      }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Request accepted");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySentRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to accept request");
    },
    ...options,
  });
}

// 🟢 FIX: backend no longer exposes '/dismiss/:id' — re-pointed to the real
// '/admin/action/:id' route with action: 'rejected', so this still works
// instead of 404ing.
export function useDismissCollaboration(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(`${API_ENDPOINTS.collaborations.list}/admin/action/${id}`, {
        action: "rejected",
      }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Request dismissed");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["mySentRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to dismiss request");
    },
    ...options,
  });
}