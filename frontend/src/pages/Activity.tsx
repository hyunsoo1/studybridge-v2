import { useEffect } from "react";
import { useStore, nowText } from "@/lib/store";
import { markNotificationsReadApi } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { Bell, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Activity() {
  const { state, updateState } = useStore();
  const events = state.events.slice(0, 20);
  const unreadCount = state.events.filter(event => !event.readAt).length;

  useEffect(() => {
    if (unreadCount === 0) return;
    markNotificationsReadApi()
      .then(events => {
        if (!events.length) return;
        updateState(draft => {
          draft.events = events;
        });
      })
      .catch(() => {});

    updateState(draft => {
      const readAt = nowText();
      draft.events.forEach(event => {
        if (!event.readAt) event.readAt = readAt;
      });
    });
  }, [unreadCount, updateState]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <Bell className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold mb-2">알림</h1>
          <p className="text-muted-foreground">신청, 수락, 댓글 같은 스터디 활동 소식을 확인합니다.</p>
          <div className="mt-3 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount}개의 새 알림을 읽음 처리했습니다.` : "모든 알림을 읽었습니다."}
          </div>
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">아직 도착한 알림이 없습니다.</p>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                key={`${event.createdAt}-${index}`}
                className={`flex gap-4 rounded-2xl border p-4 shadow-sm ${event.readAt ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${event.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-relaxed text-foreground">{event.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.createdAt}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
