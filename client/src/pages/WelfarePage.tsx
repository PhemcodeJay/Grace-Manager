import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WelfareCase, Member, InsertWelfareCase } from "@shared/schema";
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
import { insertWelfareCaseSchema } from "@shared/schema";
import { Plus, HeartHandshake, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WelfarePage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: cases = [], isLoading: loadingCases } = useQuery<WelfareCase[]>({
    queryKey: [api.welfare.list.path],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: [api.members.list.path],
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertWelfareCase) => {
      const res = await fetch(api.welfare.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create welfare case");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.welfare.list.path] });
      toast({ title: "Success", description: "Welfare case created" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const form = useForm<InsertWelfareCase>({
    resolver: zodResolver(insertWelfareCaseSchema),
    defaultValues: {
      type: "medical",
      description: "",
      status: "pending",
      memberId: null,
      beneficiaryName: "",
      amountRequested: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "disbursed": return <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Disbursed</Badge>;
      case "rejected": return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default: return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Welfare & Benevolence" 
        description="Track assistance requests and benevolence disbursement"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-welfare">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Assistance Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary Member (Optional)</FormLabel>
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
                          <SelectItem value="none">Non-member / Community</SelectItem>
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
                {!form.watch("memberId") && (
                  <FormField
                    control={form.control}
                    name="beneficiaryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficiary Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full Name" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="school_fees">School Fees</SelectItem>
                            <SelectItem value="funeral">Funeral</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amountRequested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Requested (Cents)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} value={field.value || 0} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Request</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Describe the situation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.filter(c => c.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.filter(c => c.status === "approved").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welfare Case History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((wc) => {
                const member = members.find(m => m.id === wc.memberId);
                return (
                  <TableRow key={wc.id}>
                    <TableCell>{wc.date ? format(new Date(wc.date), "MMM d, yyyy") : "N/A"}</TableCell>
                    <TableCell>
                      {member ? `${member.firstName} ${member.lastName}` : wc.beneficiaryName}
                    </TableCell>
                    <TableCell className="capitalize">{wc.type}</TableCell>
                    <TableCell>${((wc.amountRequested || 0) / 100).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(wc.status || "pending")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {cases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No welfare cases found.
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