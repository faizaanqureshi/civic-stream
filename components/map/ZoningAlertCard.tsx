import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { formatFullDate } from "@/lib/utils/formatDate";
import type { ZoningAlert } from "@/types";

interface ZoningAlertCardProps {
  alert: ZoningAlert;
  onViewOnMap?: () => void;
  isSelected?: boolean;
}

export function ZoningAlertCard({
  alert,
  onViewOnMap,
  isSelected,
}: ZoningAlertCardProps) {
  const router = useRouter();

  const getTypeColors = (type: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string; dot: string } } = {
      Rezoning: { bg: "bg-purple-50/50", border: "border-purple-200", text: "text-purple-600", dot: "bg-purple-500" },
      "New Development": { bg: "bg-blue-50/50", border: "border-blue-200", text: "text-blue-600", dot: "bg-blue-500" },
      Infrastructure: { bg: "bg-orange-50/50", border: "border-orange-200", text: "text-orange-600", dot: "bg-orange-500" },
      Heritage: { bg: "bg-emerald-50/50", border: "border-emerald-200", text: "text-emerald-600", dot: "bg-emerald-500" },
    };
    return colors[type] || { bg: "bg-white", border: "border-gray-200", text: "text-gray-600", dot: "bg-gray-500" };
  };

  const typeColors = getTypeColors(alert.type);

  return (
    <div
      onClick={onViewOnMap}
      className={`relative ${typeColors.bg} border ${isSelected ? `${typeColors.border} shadow-lg ring-2 ring-opacity-20` : "border-gray-100 hover:border-gray-200"} border-l-4 ${isSelected ? typeColors.border : typeColors.border} rounded-xl p-4 cursor-pointer transition-all duration-300`}
      style={isSelected ? { borderLeftColor: typeColors.dot.replace('bg-', '#') } : {}}
    >
      {/* Selected indicator pulse */}
      {isSelected && (
        <div className="absolute -top-1 -right-1">
          <div className="relative">
            <div className={`w-3 h-3 ${typeColors.dot} rounded-full`} />
            <div className={`absolute inset-0 w-3 h-3 ${typeColors.dot} rounded-full animate-ping opacity-75`} />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold ${typeColors.text}`}>
              {alert.type}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{alert.status}</span>
          </div>
          <h3 className={`text-sm font-semibold leading-snug mb-2 transition-colors ${
            isSelected ? "text-gray-900" : "text-gray-900"
          }`}>
            {alert.title}
          </h3>
        </div>
        <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-all ${
          isSelected ? "text-gray-900 translate-x-0.5" : "text-gray-300"
        }`} />
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
        {alert.summary}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {formatFullDate(alert.date)}
        </span>
        <div className="flex items-center gap-3">
          {alert.linkedBillId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/bill/${alert.linkedBillId}`);
              }}
              className="flex items-center gap-1 text-xs text-gray-900 font-medium hover:underline"
            >
              View bill
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {alert.url && (
            <a
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-gray-900 hover:underline transition-colors"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
