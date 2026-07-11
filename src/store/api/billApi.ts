import { baseApi } from "./baseApi";
import type { Bill, BillCreateRequest } from "@/types";
import { mapBill, toApiId } from "@/lib/api-mappers";
import { queryNullable } from "@/lib/api-query";

export interface BillCreateFromTokenRequest {
  tokenId: string;
  patientId: string;
}

export const billApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBills: builder.query<Bill[], void>({
      query: () => "/Bill/getall-bills",
      transformResponse: (response: unknown) =>
        Array.isArray(response)
          ? response.map((item) => mapBill(item as Record<string, unknown>))
          : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Bill" as const, id })),
              { type: "Bill", id: "LIST" },
            ]
          : [{ type: "Bill", id: "LIST" }],
    }),
    getBillByVisit: builder.query<Bill | null, string>({
      async queryFn(visitId, api, extraOptions, baseQuery) {
        return queryNullable(
          `/Bill/visit/${visitId}`,
          (dto) => mapBill(dto, visitId),
          baseQuery,
          api,
          extraOptions
        );
      },
      providesTags: (_result, _error, visitId) => [
        { type: "Bill", id: `VISIT_${visitId}` },
      ],
    }),
    getBillByToken: builder.query<Bill | null, string>({
      async queryFn(tokenId, api, extraOptions, baseQuery) {
        return queryNullable(
          `/Bill/token/${tokenId}`,
          (dto) => mapBill(dto, tokenId),
          baseQuery,
          api,
          extraOptions
        );
      },
      providesTags: (_result, _error, tokenId) => [
        { type: "Bill", id: `TOKEN_${tokenId}` },
      ],
    }),
    createBill: builder.mutation<Bill, BillCreateRequest>({
      query: (body) => ({
        url: "/Bill",
        method: "POST",
        body: {
          visitId: toApiId(body.visitId),
          extraCharges: body.extraCharges ?? 0,
          discount: body.discount ?? 0,
          paymentMethod: 0,
          isPaid: false,
        },
      }),
      transformResponse: (response: unknown, _meta, arg) =>
        mapBill(response as Record<string, unknown> | null | undefined, arg.visitId),
      invalidatesTags: (_result, _error, { visitId }) => [
        { type: "Bill", id: "LIST" },
        { type: "Bill", id: `VISIT_${visitId}` },
        "Dashboard",
      ],
    }),
    createBillFromToken: builder.mutation<Bill, BillCreateFromTokenRequest>({
      query: (body) => ({
        url: "/Bill/token",
        method: "POST",
        body: {
          tokenId: toApiId(body.tokenId),
          patientId: toApiId(body.patientId),
        },
      }),
      transformResponse: (response: unknown, _meta, arg) =>
        mapBill(response as Record<string, unknown>, arg.tokenId),
      invalidatesTags: () => [
        { type: "Bill", id: "LIST" },
        "Dashboard",
      ],
    }),
    updateBillCharges: builder.mutation<Bill, { id: string; extraCharges: number }>(
      {
        query: (body) => ({
          url: `/Bill/${body.id}`,
          method: "PATCH",
          body: {
            extraCharges: body.extraCharges,
          },
        }),
        transformResponse: (response: unknown) =>
          mapBill(response as Record<string, unknown>),
        invalidatesTags: (_result, _error, { id }) => [
          { type: "Bill", id },
          { type: "Bill", id: "LIST" },
          "Dashboard",
        ],
      }
    ),
    markBillPaid: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Bill/${id}/paid`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Bill", id },
        { type: "Bill", id: "LIST" },
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetBillByVisitQuery,
  useGetBillByTokenQuery,
  useGetAllBillsQuery,
  useCreateBillMutation,
  useCreateBillFromTokenMutation,
  useUpdateBillChargesMutation,
  useMarkBillPaidMutation,
} = billApi;
