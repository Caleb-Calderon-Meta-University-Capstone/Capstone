import React from "react";

export function Avatar({ className = "", children }) {
	return <div className={`relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200 ${className}`}>{children}</div>;
}

export function AvatarImage({ src, alt }) {
	return <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />;
}

export function AvatarFallback({ children }) {
	return <span className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600">{children}</span>;
}
