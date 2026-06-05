import { baseApi } from "./baseApi";
import type { Bill, BillCreateRequest } from "@/types";
import { mapBill, toApiId } from "@/lib/api-mappers";

export interface BillCreateFromTokenRequest {
  tokenId: string;
  patientId: string;
}

export const billApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBillByVisit: builder.query<Bill | null, string>({
      query: (visitId) => `/Bill/visit/${visitId}`,
      transformResponse: (response: unknown, _meta, visitId) => {
        if (!response || typeof response !== "object") return null;
        return mapBill(response as Record<string, unknown>, visitId);
      },
      providesTags: (_result, _error, visitId) => [
        { type: "Bill", id: `VISIT_${visitId}` },
      ],
    }),
    getBillByToken: builder.query<Bill | null, string>({
      query: (tokenId) => `/Bill/token/${tokenId}`,
      transformResponse: (response: unknown, _meta, tokenId) => {
        if (!response || typeof response !== "object") return null;
        return mapBill(response as Record<string, unknown>, tokenId);
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
    markBillPaid: builder.mutation<Bill, string>({
      query: (id) => ({
        url: `/Bill/${id}/paid`,
        method: "PUT",
      }),
      transformResponse: (response: unknown) =>
        mapBill(response as Record<string, unknown>),
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
  useCreateBillMutation,
  useCreateBillFromTokenMutation,
  useUpdateBillChargesMutation,
  useMarkBillPaidMutation,
} = billApi;
