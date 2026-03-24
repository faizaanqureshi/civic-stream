import type { Activity } from "@/types";

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.action}</p>
              <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
