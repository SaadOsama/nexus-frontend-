import { useQuery } from "@tanstack/react-query";
import api from "../axios/index";
import { API_ENDPOINTS } from "../endpoints/index";

export function useGetProjects(options = {}) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS?.projects?.list || "/projects");
      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      // Data normalization logic
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
    },
    ...options,
  });
}