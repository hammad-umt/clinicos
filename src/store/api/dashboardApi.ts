import { baseApi } from "./baseApi";
import type { DashboardStats } from "@/types";
import { mapDashboardStats } from "@/lib/api-mappers";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/Dashboard/stats",
      transformResponse: (response: unknown) =>
        mapDashboardStats(response as Record<string, unknown>),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
