import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { 
  useGetCollaborationRequests, 
  useAcceptCollaboration, 
  useDismissCollaboration 
} from "@/api/hooks/useCollaboration";
import api from "../../../src/api/axios";
import { API_ENDPOINTS } from "../../../src/api/endpoint";

// export function useGetCollaborationRequests(options = {}) {
//   return useQuery({
//     queryKey: ["collaborationRequests"],
//     queryFn: async () => {
//       const res = await api.get(API_ENDPOINTS.collaborations?.list || "/collaborations");
//       return res.data?.data || res.data || [];
//     },
//     ...options,
//   });
// }

export function useSendCollaborationRequest(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(API_ENDPOINTS.collaborations?.send || "/collaborations/send", payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Collaboration request sent!");
      queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send request");
    },
    ...options,
  });
}

// export function useAcceptCollaboration(options = {}) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id) =>
//       api.post(`${API_ENDPOINTS.collaborations?.accept || "/collaborations/accept"}/${id}`),
//     onSuccess: (res) => {
//       toast.success(res?.data?.message || "Request accepted");
//       queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
//     },
//     onError: (err) => {
//       toast.error(err?.response?.data?.message || "Failed to accept request");
//     },
//     ...options,
//   });
// }

// export function useDismissCollaboration(options = {}) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id) =>
//       api.post(`${API_ENDPOINTS.collaborations?.dismiss || "/collaborations/dismiss"}/${id}`),
//     onSuccess: (res) => {
//       toast.info(res?.data?.message || "Request dismissed");
//       queryClient.invalidateQueries({ queryKey: ["collaborationRequests"] });
//     },
//     onError: (err) => {
//       toast.error(err?.response?.data?.message || "Failed to dismiss request");
//     },
//     ...options,
//   });
// }