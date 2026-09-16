import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../axios";

export function useGetPendingProjects(options = {}) {
  return useQuery({
    queryKey: ["projects", "pendingApprovals"],
    queryFn: async () => {
      const response = await api.get("/api/projects/admin/pending");
      return response.data?.data || [];
    },
    ...options,
  });
}

export function useProjectAdminAction(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, adminNote }) =>
      api.post(`/api/projects/admin/action/${id}`, { action, adminNote }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Project updated");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update project");
    },
    ...options,
  });
}