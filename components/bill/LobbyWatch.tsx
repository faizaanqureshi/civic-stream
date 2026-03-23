import { Building2 } from "lucide-react";
import type { Bill } from "@/types";

interface LobbyWatchProps {
  bill: Bill;
}

export function LobbyWatch({ bill }: LobbyWatchProps) {
  if (!bill.lobbyMeetings || bill.lobbyMeetings.length === 0) {
    return null;
  }

  const getPositionColor = (position?: string) => {
    switch (position) {
      case "For":
        return "bg-green-50 text-green-700 border-green-100";
      case "Against":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">
          Lobby Disclosures
        </h3>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
        {bill.lobbyMeetings.map((meeting, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {meeting.group}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{meeting.date}</p>
            </div>
            {meeting.position && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPositionColor(
                  meeting.position
                )}`}
              >
                {meeting.position}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
