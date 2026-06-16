import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMember } from "@shared/routes";

export function useMembers(search?: string) {
  return useQuery({
    queryKey: [api.members.list.path, search],
    queryFn: async () => {
      const url = buildUrl(api.members.list.path);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      
      const res = await fetch(`${url}?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return api.members.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMember) => {
      const res = await fetch(api.members.create.path, {
        method: api.members.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create member");
      return api.members.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertMember>) => {
      const url = buildUrl(api.members.update.path, { id });
      const res = await fetch(url, {
        method: api.members.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return api.members.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.members.delete.path, { id });
      const res = await fetch(url, { method: api.members.delete.method });
      if (!res.ok) throw new Error("Failed to delete member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
