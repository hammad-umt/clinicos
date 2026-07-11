import type {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

type AppBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;

export async function queryNullable<T>(
  url: string,
  mapper: (data: Record<string, unknown>) => T,
  baseQuery: AppBaseQuery,
  api: BaseQueryApi,
  extraOptions: object
): Promise<{ data: T | null } | { error: FetchBaseQueryError }> {
  const result = await baseQuery(url, api, extraOptions);

  if (result.error?.status === 404) {
    return { data: null };
  }

  if (result.error) {
    return { error: result.error };
  }

  if (!result.data || typeof result.data !== "object") {
    return { data: null };
  }

  return { data: mapper(result.data as Record<string, unknown>) };
}
