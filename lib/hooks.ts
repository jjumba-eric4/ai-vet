"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import * as api from "@/lib/api";
import { useProfile } from "@/lib/profile-context";
import type { Role, User } from "@/lib/types";

// Access control: redirects to the profile picker or the right home if the
// active profile is missing or doesn't match the role a page requires.
export function useRequireProfile(requiredRole?: Role) {
  const router = useRouter();
  const { userId, ready } = useProfile();
  const { data: user, isLoading } = useUser(userId);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace("/");
      return;
    }
    if (user && requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "vet" ? "/vet" : "/home");
    }
  }, [ready, userId, user, requiredRole, router]);

  return { user, isLoading: isLoading || !ready };
}

// Users
export function useUsers(role?: Role) {
  return useQuery({ queryKey: ["users", role ?? "all"], queryFn: () => api.fetchUsers(role) });
}

export function useUser(id: string | null | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api.fetchUser(id as string),
    enabled: !!id,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; availability: User["availability"]; busy_until?: string | null; opens_at?: string | null }) =>
      api.updateAvailability(vars.id, vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["user", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Animals
export function useAnimals(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ["animals", ownerId],
    queryFn: () => api.fetchAnimals(ownerId ?? undefined),
    enabled: !!ownerId,
  });
}

export function useAnimal(id: string | null | undefined) {
  return useQuery({
    queryKey: ["animal", id],
    queryFn: () => api.fetchAnimal(id as string),
    enabled: !!id,
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
  });
}

// Health reports
export function useReports(filter: api.ReportsFilter) {
  return useQuery({
    queryKey: ["reports", filter],
    queryFn: () => api.fetchReports(filter),
    enabled: !!(filter.farmerId || filter.vetId || filter.status),
  });
}

export function useReport(id: string | null | undefined) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => api.fetchReport(id as string),
    enabled: !!id,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useReviewReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: api.ReviewReportInput }) => api.reviewReport(vars.id, vars.input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report", vars.id] });
    },
  });
}

export function useToggleTreatmentItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reportId: string; index: number; done: boolean }) =>
      api.toggleTreatmentItem(vars.reportId, vars.index, vars.done),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["report", vars.reportId] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// Appointments
export function useAppointments(filter: api.AppointmentsFilter) {
  return useQuery({
    queryKey: ["appointments", filter],
    queryFn: () => api.fetchAppointments(filter),
    enabled: !!(filter.farmerId || filter.vetId),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: Parameters<typeof api.updateAppointmentStatus>[1] }) =>
      api.updateAppointmentStatus(vars.id, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
