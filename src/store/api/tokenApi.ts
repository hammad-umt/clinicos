import { baseApi } from "./baseApi";
import type { Token, TokenCreateRequest, TokenStatus } from "@/types";
import {
  mapArray,
  mapToken,
  mapTokenStatusToApi,
  toApiId,
} from "@/lib/api-mappers";

export const tokenApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTodayTokens: builder.query<Token[], string>({
      query: (doctorId) => `/Token/today/${doctorId}`,
      transformResponse: (response: unknown) =>
        mapArray(response, mapToken),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Token" as const, id })),
            { type: "Token", id: "LIST" },
          ]
          : [{ type: "Token", id: "LIST" }],
    }),
    getAllTokens: builder.query<Token[], void>({
      query: () => "/Token",
      transformResponse: (response: unknown) =>
        mapArray(response, mapToken),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({
              type: "Token" as const,
              id,
            })),
            { type: "Token", id: "LIST" },
          ]
          : [{ type: "Token", id: "LIST" }],
    }),
    createToken: builder.mutation<Token, TokenCreateRequest>({
      query: (body) => ({
        url: "/Token",
        method: "POST",
        body: {
          patientId: toApiId(body.patientId),
          doctorId: toApiId(body.doctorId),
        },
      }),
      transformResponse: (response: unknown) =>
        mapToken(response as Record<string, unknown> | null | undefined),
      invalidatesTags: [{ type: "Token", id: "LIST" }, "Dashboard"],
    }),
    updateTokenStatus: builder.mutation<
      void,
      { id: string; status: TokenStatus }
    >({
      query: ({ id, status }) => ({
        url: `/Token/${id}/status?status=${encodeURIComponent(
          mapTokenStatusToApi(status)
        )}`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Token", id },
        { type: "Token", id: "LIST" },
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetTodayTokensQuery,
  useCreateTokenMutation,
  useUpdateTokenStatusMutation,
  useGetAllTokensQuery,
} = tokenApi;
