import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, CheckCircle2, Info, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LiveEvent = {
  type: string;
  message: string;
  severity: "info" | "success" | "warning";
  timestamp: string;
};

const SEVERITY_META = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
};

export function LiveNotifications() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE stream for real-time notifications
    try {
      const es = new EventSource("/api/socialhub/events/stream");
      eventSourceRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => { setConnected(false); es.close(); };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as LiveEvent;
          if (data.type !== "connected") {
            setEvents(prev => [{ ...data, timestamp: data.timestamp || new Date().toISOString() }, ...prev].slice(0, 20));
          }
        } catch {}
      };
    } catch {
      // Never synthesize activity that did not come from the authenticated stream.
      setConnected(false);
    }

    return () => { eventSourceRef.current?.close(); };
  }, []);

  const unreadCount = events.length;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notificações em tempo real"
      >
        <Bell className="w-4 h-4" />
        {connected && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 pulse-live" />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-xl z-50 slide-in-right">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-500 pulse-live" : "bg-muted")} />
              <span className="text-sm font-semibold">Notificações</span>
              {connected && <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Live</Badge>}
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2">
            {events.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{connected ? "Conectado em tempo real" : "Reconectando..."}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {events.map((ev, i) => {
                  const meta = SEVERITY_META[ev.severity] || SEVERITY_META.info;
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", meta.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{ev.message}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(ev.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
