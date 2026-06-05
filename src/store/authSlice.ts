import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { JwtPayload, UserRole } from "@/types";

interface AuthState {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: JwtPayload }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isHydrated = true;
    },
    hydrateAuth: (
      state,
      action: PayloadAction<{ token: string; user: JwtPayload } | null>
    ) => {
      if (action.payload) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
      state.isHydrated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
    },
  },
});

export const { setCredentials, hydrateAuth, logout } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectRole = (state: { auth: AuthState }): UserRole | null =>
  state.auth.user?.role ?? null;
export const selectDoctorId = (state: { auth: AuthState }): string | null =>
  state.auth.user?.doctorId ?? null;

export default authSlice.reducer;
