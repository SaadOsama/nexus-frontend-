import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { API_ENDPOINTS } from "../endpoint";
import api from "../axios";
import { setMyProjects, setBrowseProjects, projectPublished } from "../../redux/slices/projectSlices";


const normalize = (rows) =>
  rows.map((p) => ({
    ...p,
    match: p.match ?? p.match_score ?? 0,
    country: p.country ?? p.location ?? "",
    tags: Array.isArray(p.tags)
      ? p.tags
      : (() => {
          try {
            return JSON.parse(p.tags || "[]");
          } catch {
            return [];
          }
        })(),
  }));

// Browse: every project, each flagged with isOwner / hasRequested by the
// backend (see projectController.getBrowseProjects). Use these flags to
// disable the "Request Collaboration" button — requirements #2 and #6.
export function useGetProjects(options = {}) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ["projects", "browse"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.projects.list);
      const rows = normalize(response.data?.data || []);
      dispatch(setBrowseProjects(rows));
      return rows;
    },
    ...options,
  });
}

// Mine: only the logged-in user's own projects — requirements #1 / #3.
export function useGetMyProjects(options = {}) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ["projects", "mine"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.projects.mine);
      const rows = normalize(response.data?.data || []);
      dispatch(setMyProjects(rows));
      return rows;
    },
    ...options,
  });
}

export function usePublishProject(options = {}) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    // user_id is intentionally NOT sent — the backend takes it from the
    // verified JWT (req.user.id), so a request can never be published on
    // someone else's behalf even if the payload is tampered with.
    mutationFn: (payload) => api.post(API_ENDPOINTS.projects.create, payload),
    onSuccess: (res, variables) => {
      toast.success(res?.data?.message || "Project published!");
      dispatch(projectPublished({ ...variables, id: res?.data?.projectId }));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to publish project");
    },
    ...options,
  });
}
