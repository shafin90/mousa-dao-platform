import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { MessageCircle, RefreshCw, ChevronRight } from "lucide-react";
import apiClient from "@/shared/services/apiClient";

const EC2_DEFAULT_ORIGIN = "http://ec2-16-171-112-9.eu-north-1.compute.amazonaws.com";
const getSocketUrl = (): string => {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return window.location.origin;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/v1\/?$/, "");
  return EC2_DEFAULT_ORIGIN;
};

type Conversation = {
  _id: string;
  customerId: { _id: string; phone: string; profile?: { firstName?: string; lastName?: string } };
  customerPhone: string;
  subject: string;
  status: "open" | "closed";
  lastMessageAt: string | null;
  lastMessage: string | null;
  unreadAgent: number;
  createdAt: string;
};

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiClient.get("/chat/conversations");
      setConversations(res.data?.data ?? []);
    } catch { setConversations([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
    const token = localStorage.getItem("token");
    if (token) {
      const s = io(getSocketUrl(), {
        auth: { token },
        transports: ["websocket"],
      });
      s.on("chat:conversation-updated", (conv: Conversation) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c._id === conv._id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = conv;
            return next;
          }
          return [conv, ...prev];
        });
      });
      socketRef.current = s;
    }
    return () => { socketRef.current?.close(); };
  }, [fetchConversations]);

  const openCount = conversations.filter((c) => c.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><MessageCircle size={24} /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("support.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("support.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {openCount > 0 && (
            <Badge variant="default" className="text-sm px-3 py-1">
              {openCount} {t("support.open")}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchConversations}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p>{t("support.noConversations")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const unread = conv.unreadAgent || 0;
            const name = conv.customerId?.profile
              ? `${conv.customerId.profile.firstName || ""} ${conv.customerId.profile.lastName || ""}`.trim()
              : conv.customerPhone || conv.customerId?.phone || "—";
            return (
              <Card
                key={conv._id}
                className={`cursor-pointer transition-colors hover:bg-secondary/50 ${unread > 0 ? "border-l-4 border-l-primary" : ""}`}
                onClick={() => navigate(`/support/${conv._id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{name}</span>
                        {unread > 0 && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage || t("support.noMessages")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={conv.status === "open" ? "default" : "secondary"} className="capitalize text-xs">
                      {t(`support.status.${conv.status}`)}
                    </Badge>
                    {unread > 0 && (
                      <Badge variant="default" className="rounded-full px-2 min-w-[20px] text-center text-xs">
                        {unread}
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportPage;
