import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

import { logout } from "@/store/authSlice";

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const requestUrl =
      typeof args === "string" ? args : (args.url ?? "");
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (!isLoginRequest && typeof window !== "undefined") {
      localStorage.removeItem("token");
      api.dispatch(logout());

      const onLoginPage = window.location.pathname === "/login";
      if (!onLoginPage) {
        window.location.href = "/login";
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Patient",
    "Doctor",
    "Token",
    "Visit",
    "Prescription",
    "Bill",
    "Dashboard",
    "Department",
    "Clinic",
  ],
  endpoints: () => ({}),
});
