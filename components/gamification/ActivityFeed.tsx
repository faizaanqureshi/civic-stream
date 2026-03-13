const DEMO_ACTIVITIES = [
  {
    id: "1",
    action: "Read summary of Bill C-18",
    time: "2 hours ago",
  },
  {
    id: "2",
    action: "Viewed Lobby Disclosure: Dairy Farmers of Canada",
    time: "2 hours ago",
  },
  {
    id: "3",
    action: "Checked Zoning Alert: Derry Heights Rezoning",
    time: "Yesterday",
  },
  {
    id: "4",
    action: "Read Bill 23 summary",
    time: "3 days ago",
  },
  {
    id: "5",
    action: "Signed petition: Protect Local Farmland",
    time: "5 days ago",
  },
];

export function ActivityFeed() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="space-y-3">
        {DEMO_ACTIVITIES.map((activity) => (
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
