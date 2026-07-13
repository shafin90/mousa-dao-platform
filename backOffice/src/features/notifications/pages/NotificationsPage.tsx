import React from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../hooks/useNotifications";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { notifications, loading, markRead, markAllRead, refresh } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><Bell size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("notifications.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("notifications.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}><CheckCheck size={16} /> {t("notifications.markAllRead")}</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}><RefreshCw size={16} /> {t("common.refresh")}</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p>{t("notifications.noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer transition-colors hover:bg-secondary/50 ${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => !notification.isRead && markRead(notification._id)}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize text-xs">{t(`notifications.types.${notification.type}`, { defaultValue: notification.type })}</Badge>
                    {!notification.isRead && <span className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <p className="text-sm">{notification.key ? t(`notifications.messages.${notification.key}`, { defaultValue: notification.message }) : notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default NotificationsPage;
