import { baseApi } from "./baseApi";
import type { Patient, PatientCreateRequest } from "@/types";
import {
  buildPatientSearchBody,
  mapArray,
  mapPatient,
  mapPatientCreate,
  toApiId,
} from "@/lib/api-mappers";

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchPatients: builder.mutation<Patient[], string>({
      query: (query) => ({
        url: "/Patient/search",
        method: "POST",
        body: buildPatientSearchBody(query),
      }),
      transformResponse: (response: unknown) =>
        mapArray(response, mapPatient),
    }),
    getAllPatients: builder.query<Patient[], void>({
      query: () => "/Patient",
      transformResponse: (response: unknown) =>
        mapArray(response, mapPatient),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Patient" as const, id })),
              { type: "Patient", id: "LIST" },
            ]
          : [{ type: "Patient", id: "LIST" }],
    })
    ,
    getPatientById: builder.query<Patient, string>({
      query: (id) => `/Patient/${id}`,
      transformResponse: (response: unknown) =>
        mapPatient(response as Record<string, unknown>),
      providesTags: (_result, _error, id) => [{ type: "Patient", id }],
    }),
    createPatient: builder.mutation<Patient, PatientCreateRequest>({
      query: (body) => ({
        url: "/Patient",
        method: "POST",
        body: mapPatientCreate(body),
      }),
      transformResponse: (response: unknown) =>
        mapPatient(response as Record<string, unknown> | null | undefined),
      invalidatesTags: [{ type: "Patient", id: "LIST" }, "Dashboard"],
    }),
    updatePatient: builder.mutation<
      Patient,
      { id: string; data: Partial<PatientCreateRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/Patient/${id}`,
        method: "PUT",
        body: mapPatientCreate({
          name: data.name ?? "",
          phone: data.phone ?? "",
          gender: data.gender ?? "Male",
          age: data.age,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
        }),
      }),
      transformResponse: (response: unknown) =>
        mapPatient(response as Record<string, unknown> | null | undefined),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Patient", id },
        { type: "Patient", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useSearchPatientsMutation,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useGetAllPatientsQuery,
} = patientApi;
