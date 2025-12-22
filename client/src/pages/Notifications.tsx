import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const notificationTypeConfig = {
  task_assigned: { icon: Clock, color: "text-blue-500" },
  task_completed: { icon: Check, color: "text-green-500" },
  comment_added: { icon: MessageSquare, color: "text-purple-500" },
  project_updated: { icon: Settings, color: "text-amber-500" },
  document_uploaded: { icon: FileText, color: "text-cyan-500" },
  member_added: { icon: Users, color: "text-pink-500" },
};

export default function Notifications() {
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({
    limit: 50,
  });

  const markAsRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark as read");
    },
  });

  const markAllAsRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark all as read");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const groupedNotifications = notifications?.reduce((acc: Record<string, typeof notifications>, notification) => {
    const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    
    let group = date;
    if (date === today) group = "Today";
    else if (date === yesterday) group = "Yesterday";
    else group = format(new Date(notification.createdAt), "MMMM d, yyyy");
    
    if (!acc[group]) acc[group] = [];
    acc[group]!.push(notification);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h2>
          <p className="text-muted-foreground">
            Stay updated on project activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <BellOff className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications || {}).map(([date, dateNotifications]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {date}
              </h3>
              <div className="space-y-2">
                {dateNotifications?.map((notification) => {
                  const config = notificationTypeConfig[notification.type as keyof typeof notificationTypeConfig];
                  const Icon = config?.icon || Bell;

                  return (
                    <Card
                      key={notification.id}
                      className={`transition-colors ${
                        !notification.isRead ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${
                              config?.color || "text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead.mutate({ id: notification.id })}
                                  disabled={markAsRead.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
