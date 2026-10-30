import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../axios/index";
import { API_ENDPOINTS } from "../endpoints/index";

// Fetch incoming requests
export function useGetCollaborationRequests(userId, options = {}) {
  return useQuery({
    queryKey: ["collaboration-requests", userId],
    queryFn: async () => {
      const response = await api.get(
        `${API_ENDPOINTS?.collaborations?.incoming || "/collaborations/incoming"}/${userId}`
      );
      return response?.data?.data || [];
    },
    enabled: !!userId,
    ...options,
  });
}

// Send request mutation
export function useSendCollaborationRequest(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      api.post(API_ENDPOINTS?.collaborations?.request || "/collaborations/request", payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Request Sent Successfully!");
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
    ...options,
  });
}

// Accept request mutation
export function useAcceptCollaboration(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) =>
      api.put(`${API_ENDPOINTS?.collaborations?.accept || "/collaborations/accept"}/${id}`),
    onSuccess: () => {
      toast.success("Request Accepted!");
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Error accepting request");
    },
    ...options,
  });
}

// Dismiss request mutation
export function useDismissCollaboration(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) =>
      api.put(`${API_ENDPOINTS?.collaborations?.dismiss || "/collaborations/dismiss"}/${id}`),
    onSuccess: () => {
      toast.info("Request Dismissed");
      queryClient.invalidateQueries({ queryKey: ["collaboration-requests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Error dismissing request");
    },
    ...options,
  });
}