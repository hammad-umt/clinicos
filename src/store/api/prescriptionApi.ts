import { baseApi } from "./baseApi";
import type { Prescription, PrescriptionCreateRequest } from "@/types";
import {
  mapPrescription,
  mapPrescriptionCreate,
} from "@/lib/api-mappers";
import { queryNullable } from "@/lib/api-query";

export const prescriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrescriptionByVisit: builder.query<Prescription | null, string>({
      async queryFn(visitId, api, extraOptions, baseQuery) {
        return queryNullable(
          `/Prescription/visit/${visitId}`,
          mapPrescription,
          baseQuery,
          api,
          extraOptions
        );
      },
      providesTags: (_result, _error, visitId) => [
        { type: "Prescription", id: `VISIT_${visitId}` },
      ],
    }),
    createPrescription: builder.mutation<Prescription, PrescriptionCreateRequest>(
      {
        query: (body) => ({
          url: "/Prescription",
          method: "POST",
          body: mapPrescriptionCreate(body),
        }),
        transformResponse: (response: unknown) =>
          mapPrescription(response as Record<string, unknown> | null | undefined),
        invalidatesTags: (_result, _error, { visitId }) => [
          { type: "Prescription", id: `VISIT_${visitId}` },
        ],
      }
    ),
    getPrescriptionPdf: builder.query<Blob, string>({
      query: (id) => ({
        url: `/Prescription/${id}/pdf`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetPrescriptionByVisitQuery,
  useCreatePrescriptionMutation,
  useLazyGetPrescriptionPdfQuery,
} = prescriptionApi;
