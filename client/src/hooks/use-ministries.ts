import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMinistry, type InsertMinistryMember } from "@shared/routes";

export function useMinistries() {
  return useQuery({
    queryKey: [api.ministries.list.path],
    queryFn: async () => {
      const res = await fetch(api.ministries.list.path);
      if (!res.ok) throw new Error("Failed to fetch ministries");
      return api.ministries.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMinistry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMinistry) => {
      const res = await fetch(api.ministries.create.path, {
        method: api.ministries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create ministry");
      return api.ministries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ministries.list.path] });
    },
  });
}

export function useMinistryMembers(ministryId: number) {
  return useQuery({
    queryKey: [api.ministries.members.list.path, ministryId],
    queryFn: async () => {
      const url = buildUrl(api.ministries.members.list.path, { id: ministryId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ministry members");
      return api.ministries.members.list.responses[200].parse(await res.json());
    },
    enabled: !!ministryId,
  });
}

export function useAddMinistryMember(ministryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertMinistryMember, "ministryId">) => {
      const url = buildUrl(api.ministries.members.add.path, { id: ministryId });
      const res = await fetch(url, {
        method: api.ministries.members.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add member to ministry");
      return api.ministries.members.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [api.ministries.members.list.path, ministryId] 
      });
    },
  });
}
