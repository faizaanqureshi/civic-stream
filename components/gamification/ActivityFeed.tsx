import { formatRelativeDate } from "@/lib/utils/formatDate";

// Inside ActivityFeed component
export function ActivityFeed({ activities }: { activities: any[] }) {
  // Ensure we only show 5
  const displayActivities = activities.slice(0, 5);

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 font-medium">{activity.action}</p>
          <span className="text-[10px] text-gray-400 uppercase font-bold">
            {/* formatRelativeDate converts ISO string to "Just now" or "Mar 24" */}
            {formatRelativeDate(activity.time)}
          </span>
        </div>
      ))}
    </div>
  );
}
