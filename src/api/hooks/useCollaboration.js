import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../axios";
import { API_ENDPOINTS } from "../endpoint";

export function useGetCollaborationRequests(options = {}) {
  return useQuery({
    queryKey: ["collaborationRequests"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.collaborations.list);
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
      toast.success(res?.data?.message || "Collaboration request sent");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
    ...options,
  });
}

export function useAcceptCollaboration(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`${API_ENDPOINTS.collaborations.accept}/${id}`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Request accepted");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to accept request");
    },
    ...options,
  });
}

export function useDismissCollaboration(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`${API_ENDPOINTS.collaborations.dismiss}/${id}`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Request dismissed");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to dismiss request");
    },
    ...options,
  });
}
