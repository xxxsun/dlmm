"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type RealtimeStatus = "connecting"|"connected"|"error"|"closed";

interface RealtimeEvent {
  type: string;
  [k: string]: any;
  timestamp?: string;
}

interface Ctx {
  status: RealtimeStatus;
  lastEvent: RealtimeEvent | null;
  lastEventTs: number | null;
  events: RealtimeEvent[];
}

const RealtimeContext = createContext<Ctx>({ status: "connecting", lastEvent:null, lastEventTs:null, events:[] });

export function useRealtime(){ return useContext(RealtimeContext); }

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [lastEvent, setLastEvent] = useState<RealtimeEvent|null>(null);
  const [lastEventTs, setLastEventTs] = useState<number|null>(null);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const esRef = useRef<EventSource|null>(null);
  const retryRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{
    let cancelled=false;
    function connect(){
      if (cancelled) return;
      setStatus("connecting");
      const es = new EventSource("/api/realtime");
      esRef.current = es;
      es.onopen = ()=> { if(!cancelled) setStatus("connected"); };
      es.onmessage = (e)=>{
        try {
          const data = JSON.parse(e.data);
          setLastEvent(data);
          setLastEventTs(Date.now());
          setEvents(prev=> [data, ...prev].slice(0,120));
        } catch {}
      };
      es.onerror = ()=>{
        setStatus("error");
        es.close();
        // fallback polling later, but try reconnect
        if (!cancelled) {
          retryRef.current = setTimeout(()=> connect(), 2500);
        }
      };
    }
    connect();
    return ()=>{
      cancelled=true;
      if (esRef.current) esRef.current.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  },[]);

  return (
    <RealtimeContext.Provider value={{ status, lastEvent, lastEventTs, events }}>
      {children}
    </RealtimeContext.Provider>
  );
}
