import { baseApi } from "./baseApi";
import type { Department } from "@/types";
import { mapArray, mapDepartment } from "@/lib/api-mappers";

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => "/Department",
      transformResponse: (response: unknown) =>
        mapArray(response, mapDepartment),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Department" as const,
                id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),
    createDepartment: builder.mutation<
      Department,
      { name: string; description?: string; clinicId: number }
    >({
      query: (body) => ({
        url: "/Department",
        method: "POST",
        body: {
          name: body.name,
          clinicId: body.clinicId,
        },
      }),
      transformResponse: (response: unknown) =>
        mapDepartment(response as Record<string, unknown> | null | undefined),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Department/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
