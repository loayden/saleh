"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";

type Notification = { id: string; title: string; body: string; read_at: string | null; created_at: string };
const dateLabel = (value: string) => new Date(value).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" });

export default function NotificationCenter({ initial }: { initial: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [message, setMessage] = useState("");
  const unread = notifications.filter((item) => !item.read_at).length;
  const markRead = async (id: string) => {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item)); else setMessage("تعذر تحديث الإشعار");
  };
  const markAll = async () => {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ readAll: true }) });
    if (response.ok) setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); else setMessage("تعذر تحديث الإشعارات");
  };
  return <div className="notification-center"><div className="notification-center-head"><div><p className="eyebrow">التحديثات</p><h2>إشعاراتك {unread > 0 && <small>{unread} جديدة</small>}</h2></div>{unread > 0 && <button className="text-button" type="button" onClick={() => void markAll()}>تحديد الكل كمقروء</button>}</div>{message && <p className="form-error">{message}</p>}{notifications.length ? <div className="notification-list">{notifications.map((item) => <article className={item.read_at ? "read" : "unread"} key={item.id}><span className="notification-icon"><Bell aria-hidden="true" /></span><div><strong>{item.title}</strong><p>{item.body}</p><small>{dateLabel(item.created_at)}</small></div>{!item.read_at && <button type="button" aria-label="تحديد كمقروء" onClick={() => void markRead(item.id)}><Check aria-hidden="true" /></button>}</article>)}</div> : <div className="account-empty"><Bell aria-hidden="true" /><h3>مفيش إشعارات دلوقتي</h3><p>هنبلغك هنا بأي تحديث على طلباتك أو طلبات التفصيل.</p></div>}</div>;
}
