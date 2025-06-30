import React from "react";
import { cn } from "../../lib/utils"; 

export const Button = ({ className, variant = "default", ...props }) => {
	const variants = {
		default: "bg-blue-600 text-white hover:bg-blue-700",
		outline: "border border-gray-300 text-black hover:bg-gray-100",
		ghost: "text-black hover:bg-gray-100",
	};

	return <button className={cn("px-4 py-2 rounded text-sm font-medium transition", variants[variant], className)} {...props} />;
};
