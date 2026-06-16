import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EvangelismRecord, Member, InsertEvangelismRecord } from "@shared/schema";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEvangelismRecordSchema } from "@shared/schema";
import { Plus, UserPlus, Phone, Mail, Filter, Search } from "lucide-react";
import { format } from "date-fns";

export default function EvangelismPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: records = [], isLoading: loadingRecords } = useQuery<EvangelismRecord[]>({
    queryKey: [api.evangelism.list.path],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: [api.members.list.path],
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertEvangelismRecord) => {
      const res = await fetch(api.evangelism.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.evangelism.list.path] });
      toast({ title: "Success", description: "New convert/visitor recorded" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const form = useForm<InsertEvangelismRecord>({
    resolver: zodResolver(insertEvangelismRecordSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      status: "new",
      contactDate: new Date().toISOString().split("T")[0],
      assignedMemberId: null,
      notes: "",
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "member": return <Badge className="bg-green-500">Member</Badge>;
      case "regular": return <Badge className="bg-blue-500">Regular</Badge>;
      case "contacted": return <Badge className="bg-orange-500">Contacted</Badge>;
      case "visiting": return <Badge className="bg-purple-500">Visiting</Badge>;
      default: return <Badge variant="outline">New</Badge>;
    }
  };

  const filteredRecords = records.filter(r => 
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Evangelism & Discipleship" 
        description="Track new converts, first-time visitors, and follow-up status"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-evangelism">
              <Plus className="mr-2 h-4 w-4" />
              Record New Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Convert / Visitor Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="assignedMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Follower</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
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
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Record Contact"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contact Pipeline</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search names..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follower</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const follower = members.find(m => m.id === record.assignedMemberId);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.contactDate ? format(new Date(record.contactDate), "MMM d, yyyy") : "N/A"}</TableCell>
                    <TableCell className="font-medium">{record.firstName} {record.lastName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-1">
                        <span className="flex items-center"><Phone className="mr-1 h-3 w-3" /> {record.phone || "No phone"}</span>
                        <span className="flex items-center"><Mail className="mr-1 h-3 w-3" /> {record.email || "No email"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status || "new")}</TableCell>
                    <TableCell>{follower ? `${follower.firstName} ${follower.lastName}` : "Unassigned"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Follow up</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}