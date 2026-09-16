import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { API_ENDPOINTS } from "../endpoint";
import api from "../axios";
import { setMyProjects, setBrowseProjects, projectPublished } from "../../redux/slices/projectSlices";

const normalize = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((p) => ({
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
};

export function useGetProjects(options = {}) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ["projects", "browse"],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS?.projects?.list || '/api/projects';
      const response = await api.get(endpoint);

      const rawData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      const rows = normalize(rawData);
      dispatch(setBrowseProjects(rows));
      return rows;
    },
    ...options,
  });
}

export function useGetMyProjects({ page = 1, limit = 6 } = {}, options = {}) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ["projects", "mine", page, limit],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS?.projects?.mine || '/api/projects/mine';
      const response = await api.get(endpoint, { params: { page, limit } });

      const rawData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      const rows = normalize(rawData);
      dispatch(setMyProjects(rows));

      return {
        rows,
        pagination: response.data?.pagination || {
          totalProjects: rows.length,
          totalPages: 1,
          currentPage: 1,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useGetSavedProjects({ page = 1, limit = 6 } = {}, options = {}) {
  return useQuery({
    queryKey: ["projects", "saved", page, limit],
    queryFn: async () => {
      // 🟢 FIX: axios baseURL already includes /api, so no /api prefix here
      const endpoint = API_ENDPOINTS?.projects?.saved || '/projects/saved';
      const response = await api.get(endpoint, { params: { page, limit } });

      const rawData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);

      const rows = normalize(rawData);

      return {
        rows,
        pagination: response.data?.pagination || {
          totalProjects: rows.length,
          totalPages: 1,
          currentPage: 1,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    },
    keepPreviousData: true,
    ...options,
  });
}

export function usePublishProject(options = {}) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (payload) => {
      const endpoint = API_ENDPOINTS?.projects?.create || '/api/projects';
      return api.post(endpoint, payload);
    },
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

export function useToggleSaveProject(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ project_id, isSaved }) => {
      // 🟢 FIX: axios baseURL already includes /api, so no /api prefix here
      const endpoint = isSaved
        ? (API_ENDPOINTS?.projects?.unsave || '/projects/unsave')
        : (API_ENDPOINTS?.projects?.save || '/projects/save');
      return api.post(endpoint, { project_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "saved"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not update saved project");
    },
    ...options,
  });
}