"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { hydrateAuth } from "@/store/authSlice";
import {
  parseJwtPayload,
  isTokenExpired,
} from "@/lib/auth";
import "@/store/api/authApi";
import "@/store/api/patientApi";
import "@/store/api/doctorApi";
import "@/store/api/tokenApi";
import "@/store/api/visitApi";
import "@/store/api/prescriptionApi";
import "@/store/api/billApi";
import "@/store/api/dashboardApi";
import "@/store/api/departmentApi";
import "@/store/api/clinicApi";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const user = parseJwtPayload(token);
        if (user && !isTokenExpired(user)) {
          store.dispatch(hydrateAuth({ token, user }));
          return;
        }
        localStorage.removeItem("token");
      } catch {
        localStorage.removeItem("token");
      }
    }
    store.dispatch(hydrateAuth(null));
  }, []);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
