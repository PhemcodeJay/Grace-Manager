import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertDonation, type InsertWelfareCase } from "@shared/routes";

// --- DONATIONS ---

export function useDonations() {
  return useQuery({
    queryKey: [api.donations.list.path],
    queryFn: async () => {
      const res = await fetch(api.donations.list.path);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return api.donations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDonation) => {
      const res = await fetch(api.donations.create.path, {
        method: api.donations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record donation");
      return api.donations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.donations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// --- WELFARE ---

export function useWelfareCases() {
  return useQuery({
    queryKey: [api.welfare.list.path],
    queryFn: async () => {
      const res = await fetch(api.welfare.list.path);
      if (!res.ok) throw new Error("Failed to fetch welfare cases");
      return api.welfare.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWelfareCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWelfareCase) => {
      const res = await fetch(api.welfare.create.path, {
        method: api.welfare.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create welfare case");
      return api.welfare.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.welfare.list.path] });
    },
  });
}

export function useUpdateWelfareCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertWelfareCase>) => {
      const url = buildUrl(api.welfare.update.path, { id });
      const res = await fetch(url, {
        method: api.welfare.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update welfare case");
      return api.welfare.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.welfare.list.path] });
    },
  });
}
