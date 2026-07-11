import { baseApi } from "./baseApi";
import type { ClinicInfo, ClinicUpdateRequest } from "@/types";
import { mapClinic, mapClinicUpdate } from "@/lib/api-mappers";

export const clinicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClinicInfo: builder.query<ClinicInfo, void>({
      query: () => "/Clinic",
      transformResponse: (response: unknown) =>
        mapClinic(response as Record<string, unknown> | null | undefined),
      providesTags: ["Clinic"],
    }),
    updateClinic: builder.mutation<void, ClinicUpdateRequest>({
      query: (body) => ({
        url: "/Clinic",
        method: "PUT",
        body: mapClinicUpdate(body),
      }),
      invalidatesTags: ["Clinic"],
    }),
  }),
});

export const { useGetClinicInfoQuery, useUpdateClinicMutation } = clinicApi;
