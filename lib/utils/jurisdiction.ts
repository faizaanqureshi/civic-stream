import type { JurisdictionLevel } from "@/types";

export function getJurisdictionColor(level: JurisdictionLevel): string {
  switch (level) {
    case "Federal":
      return "#D71920";
    case "Provincial":
      return "#003F8A";
    case "Municipal":
      return "#2D7A45";
  }
}

export function getJurisdictionBgClass(level: JurisdictionLevel): string {
  switch (level) {
    case "Federal":
      return "bg-red-100 text-red-800";
    case "Provincial":
      return "bg-blue-100 text-blue-800";
    case "Municipal":
      return "bg-green-100 text-green-800";
  }
}

export function getJurisdictionBorderClass(level: JurisdictionLevel): string {
  switch (level) {
    case "Federal":
      return "border-l-red-600";
    case "Provincial":
      return "border-l-blue-600";
    case "Municipal":
      return "border-l-green-600";
  }
}
