import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data: events, isLoading } = useEvents(); // Fetch all for now, filter in UI or hook
  const [isOpen, setIsOpen] = useState(false);

  // Simple filtering for selected date
  const selectedDateEvents = events?.filter(e => {
    if (!date) return true;
    const eventDate = new Date(e.startTime);
    return eventDate.toDateString() === date.toDateString();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Events & Calendar" description="Schedule and manage church activities">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Event
            </Button>
          </DialogTrigger>
          <EventForm onClose={() => setIsOpen(false)} selectedDate={date} />
        </Dialog>
      </PageHeader>

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">
            {date ? date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "All Events"}
          </h2>
          
          {isLoading ? (
            <p>Loading events...</p>
          ) : selectedDateEvents?.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">No events scheduled for this day.</p>
              <Button variant="ghost" onClick={() => setIsOpen(true)}>Create one?</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {selectedDateEvents?.map(event => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {" - "}
                          {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        •
                        <span className="capitalize">{event.type}</span>
                      </p>
                      {event.location && <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>}
                    </div>
                    <div className="w-1 h-12 bg-primary/20 rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventForm({ onClose, selectedDate }: { onClose: () => void; selectedDate?: Date }) {
  const { mutate, isPending } = useCreateEvent();
  const { toast } = useToast();
  
  // Create schema with coerces for dates
  const formSchema = insertEventSchema.extend({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "Main Sanctuary",
      type: "service",
      startTime: selectedDate ? new Date(selectedDate.setHours(9, 0)) : new Date(),
      endTime: selectedDate ? new Date(selectedDate.setHours(11, 0)) : new Date(),
    }
  });

  function onSubmit(data: any) {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Event scheduled" });
        onClose();
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Schedule Event</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="rehearsal">Rehearsal</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
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
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}
