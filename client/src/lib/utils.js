import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getDiscountPercent(originalPrice, salePrice) {
  if (!originalPrice || !salePrice) return 0;

  return Math.round(
    ((originalPrice - salePrice) / originalPrice) * 100
  );
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "completed":
    case "success":
      return "bg-green-100 text-green-800";

    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";

    case "processing":
      return "bg-blue-100 text-blue-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}