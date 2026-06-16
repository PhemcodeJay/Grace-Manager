import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ministry, Member, InsertMinistry } from "@shared/schema";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMinistrySchema } from "@shared/schema";
import { Plus, Users, Music, Camera, ShieldCheck, UserCircle } from "lucide-react";

export default function MinistriesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: ministries = [], isLoading: loadingMinistries } = useQuery<Ministry[]>({
    queryKey: [api.ministries.list.path],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: [api.members.list.path],
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMinistry) => {
      const res = await fetch(api.ministries.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create ministry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ministries.list.path] });
      toast({ title: "Success", description: "Ministry created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const form = useForm<InsertMinistry>({
    resolver: zodResolver(insertMinistrySchema),
    defaultValues: {
      name: "",
      type: "choir",
      description: "",
      leaderId: null,
    },
  });

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "choir": return <Music className="h-5 w-5" />;
      case "media": return <Camera className="h-5 w-5" />;
      case "usher": return <ShieldCheck className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Ministries" 
        description="Manage church groups, choirs, and service teams"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ministry">
              <Plus className="mr-2 h-4 w-4" />
              Add Ministry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ministry</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministry Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Youth Choir" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="choir">Choir</SelectItem>
                          <SelectItem value="media">Media Team</SelectItem>
                          <SelectItem value="usher">Ushers / Greeters</SelectItem>
                          <SelectItem value="small_group">Small Group</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministry Leader</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a leader" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No leader assigned</SelectItem>
                          {members.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              {m.firstName} {m.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brief purpose of the ministry" value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating..." : "Create Ministry"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ministries.map((ministry) => {
          const leader = members.find(m => m.id === ministry.leaderId);
          return (
            <Card key={ministry.id} className="hover-elevate">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{ministry.name}</CardTitle>
                  <CardDescription className="capitalize">{ministry.type} Ministry</CardDescription>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {getIcon(ministry.type)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Leader: {leader ? `${leader.firstName} ${leader.lastName}` : "Not assigned"}
                  </div>
                  <p className="text-sm line-clamp-2">
                    {ministry.description || "No description provided."}
                  </p>
                  <Button variant="outline" className="w-full" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {ministries.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No ministries found. Start by creating one.
          </div>
        )}
      </div>
    </div>
  );
}