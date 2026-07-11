import { baseApi } from "./baseApi";
import type { Visit, VisitCreateRequest } from "@/types";
import { mapArray, mapVisit, mapVisitCreate } from "@/lib/api-mappers";

export interface VisitUpdateRequest {
  id: string;
  chiefComplaint?: string;
  diagnosis?: string;
}

export const visitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVisitById: builder.query<Visit, string>({
      query: (id) => `/Visit/${id}`,
      transformResponse: (response: unknown) =>
        mapVisit(response as Record<string, unknown> | null | undefined),
      providesTags: (_result, _error, id) => [{ type: "Visit", id }],
    }),
    getVisitsByPatient: builder.query<Visit[], string>({
      query: (patientId) => `/Visit/patient/${patientId}`,
      transformResponse: (response: unknown) =>
        mapArray(response, mapVisit),
      providesTags: (result, _error, patientId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Visit" as const, id })),
              { type: "Visit", id: `PATIENT_${patientId}` },
            ]
          : [{ type: "Visit", id: `PATIENT_${patientId}` }],
    }),
    createVisit: builder.mutation<Visit, VisitCreateRequest>({
      query: (body) => {
        const mapped = mapVisitCreate(body);
        return {
          url: "/Visit",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: mapped,
        };
      },
      transformResponse: (response: unknown) =>
        mapVisit(response as Record<string, unknown> | null | undefined),
      invalidatesTags: (_result, _error, { patientId }) => [
        { type: "Visit", id: `PATIENT_${patientId}` },
        "Dashboard",
      ],
    }),
    updateVisit: builder.mutation<Visit, VisitUpdateRequest>({
      query: (body) => ({
        url: `/Visit/${body.id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: {
          chiefComplaint: body.chiefComplaint ?? "",
          diagnosis: body.diagnosis ?? "",
        },
      }),
      transformResponse: (response: unknown) =>
        mapVisit(response as Record<string, unknown> | null | undefined),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Visit", id },
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetVisitByIdQuery,
  useGetVisitsByPatientQuery,
  useCreateVisitMutation,
  useUpdateVisitMutation,
} = visitApi;
