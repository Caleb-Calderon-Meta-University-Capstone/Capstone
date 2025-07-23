import React from "react";
import { HelpCircle } from "lucide-react";

const HelpTooltip = ({ children, className = "" }) => (
	<div className={`relative inline-block ${className}`}>
		<HelpCircle className="peer w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
		<div className="pointer-events-none opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-900 text-sm rounded-lg shadow-lg p-4 z-50">
			<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-l border-t border-gray-200 rotate-45" />
			{children}
		</div>
	</div>
);

export default HelpTooltip;
