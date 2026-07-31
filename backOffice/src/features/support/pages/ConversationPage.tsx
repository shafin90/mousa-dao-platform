import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import apiClient from "@/shared/services/apiClient";

type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: { _id: string; phone: string; role: string; profile?: { firstName?: string; lastName?: string } };
  senderRole: string;
  text: string;
  createdAt: string;
};

const ConversationPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiClient.get(`/chat/conversations/${id}/messages`);
      const msgs = res.data?.data ?? [];
      setMessages(msgs);
      const cust = msgs.find((m: ChatMessage) => m.senderRole === "customer")?.senderId;
      if (cust) {
        const name = cust.profile
          ? `${cust.profile.firstName || ""} ${cust.profile.lastName || ""}`.trim()
          : cust.phone;
        setCustomerName(name || "—");
      }
      await apiClient.post(`/chat/conversations/${id}/read`, {});
    } catch { }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchMessages();
    const token = localStorage.getItem("token");
    if (token) {
      const s = io(import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:3000", {
        auth: { token },
        transports: ["websocket"],
      });
      s.on("chat:message", (msg: ChatMessage) => {
        if (msg.conversationId !== id) return;
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderRole === "customer") {
          apiClient.post(`/chat/conversations/${id}/read`, {});
        }
      });
      socketRef.current = s;
    }
    return () => { socketRef.current?.close(); };
  }, [id, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:send", { conversationId: id, text: text.trim() });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {customerName ? customerName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{customerName || t("support.loading")}</h2>
            <p className="text-xs text-muted-foreground">{t("support.online")}</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse w-3/4" />)}</div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground gap-3 flex-col">
              <MessageCircle size={40} className="opacity-30" />
              <p>{t("support.noMessages")}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAgent = msg.senderRole !== "customer";
              return (
                <div key={msg._id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      isAgent
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[11px] mt-1 ${isAgent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="p-4 border-t border-border">
          <div className="flex gap-3 items-end">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("support.typePlaceholder")}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConversationPage;
