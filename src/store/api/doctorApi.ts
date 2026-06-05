import { baseApi } from "./baseApi";
import type { Doctor, DoctorCreateRequest } from "@/types";
import { mapArray, mapDoctor, toApiId } from "@/lib/api-mappers";

export const doctorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDoctors: builder.query<Doctor[], void>({
      query: () => "/Doctor",
      transformResponse: (response: unknown) =>
        mapArray(response, mapDoctor),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Doctor" as const, id })),
              { type: "Doctor", id: "LIST" },
            ]
          : [{ type: "Doctor", id: "LIST" }],
    }),
    createDoctor: builder.mutation<Doctor, DoctorCreateRequest>({
      query: (body) => ({
        url: "/Doctor",
        method: "POST",
        body: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          password: body.password,
          specialization: body.specialization,
          consultationFee: body.consultationFee,
          departmentId: toApiId(body.departmentId),
        },
      }),
      transformResponse: (response: unknown) =>
        mapDoctor(response as Record<string, unknown> | null | undefined),
      invalidatesTags: [{ type: "Doctor", id: "LIST" }, "Dashboard"],
    }),
    updateDoctor: builder.mutation<
      Doctor,
      { id: string; data: Partial<DoctorCreateRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/Doctor/${id}`,
        method: "PUT",
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          consultationFee: data.consultationFee,
          specialization: data.specialization,
          departmentId: data.departmentId ? toApiId(data.departmentId) : undefined,
        },
      }),
      transformResponse: (response: unknown) =>
        mapDoctor(response as Record<string, unknown> | null | undefined),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Doctor", id },
        { type: "Doctor", id: "LIST" },
      ],
    }),
    deleteDoctor: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Doctor/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Doctor", id: "LIST" }, "Dashboard"],
    }),
  }),
});

export const {
  useGetDoctorsQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} = doctorApi;
