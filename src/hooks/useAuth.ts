"use client";

import { useSelector } from "react-redux";
import { selectAuth, selectRole, selectDoctorId } from "@/store/authSlice";

export function useAuth() {
  const auth = useSelector(selectAuth);
  const role = useSelector(selectRole);
  const doctorId = useSelector(selectDoctorId);

  return {
    ...auth,
    role,
    doctorId,
    userName: auth.user?.name ?? "",
    userEmail: auth.user?.email ?? "",
  };
}
