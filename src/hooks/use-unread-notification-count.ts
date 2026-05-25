import { useEffect, useState } from "react";
import { Subscription } from "rxjs";

import notifications$ from "../services/notifications";
import readStatusService from "../services/read-status";
import localSettings from "../services/preferences";

export default function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const innerSubs: Subscription[] = [];

    const sub = notifications$.subscribe((events) => {
      innerSubs.forEach((s) => s.unsubscribe());
      innerSubs.length = 0;

      const lastReadAt = localSettings.lastNotificationReadAt.value;

      const recount = () => {
        let c = 0;
        for (const event of events) {
          if (lastReadAt && event.created_at <= lastReadAt) continue;
          const status = readStatusService.getStatus(event.id).value;
          if (status !== true) c++;
        }
        setCount(c);
      };

      for (const event of events) {
        const subject = readStatusService.getStatus(event.id);
        innerSubs.push(subject.subscribe(recount));
      }
      recount();
    });

    return () => {
      sub.unsubscribe();
      innerSubs.forEach((s) => s.unsubscribe());
    };
  }, []);

  return count;
}
