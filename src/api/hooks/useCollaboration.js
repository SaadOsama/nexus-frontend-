import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../axios";
import { API_ENDPOINTS } from "../endpoint";

// NOTE: endpoint key names below (API_ENDPOINTS.collaboration.*) are a
// best guess following the same shape as API_ENDPOINTS.projects.* and
// API_ENDPOINTS.auth.*. Open src/api/endpoint.js and confirm/replace
// these keys with whatever actually exists there for collaboration
// requests (list / accept / dismiss).

export function useGetCollaborationRequests(options = {}) {
  return useQuery({
    queryKey: ["collaborationRequests"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.collaboration.list);
      return response.data?.data || [];
    },
    ...options,
  });
}

export function useAcceptCollaboration(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(API_ENDPOINTS.collaboration.accept(id)),
    onSuccess: (res, id) => {
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
    mutationFn: (id) => api.post(API_ENDPOINTS.collaboration.dismiss(id)),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to dismiss request");
    },
    ...options,
  });
}
