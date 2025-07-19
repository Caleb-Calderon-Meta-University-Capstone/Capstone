import React, { useMemo } from "react";

const LOADING_MESSAGE = "Loading MICS Connect...";

export default function LoadingSpinner() {
	const spinnerClasses = useMemo(() => "w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin transition-all duration-500 ease-in-out", []);

	const containerClasses = useMemo(() => "flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300", []);

	const contentClasses = useMemo(() => "flex flex-col items-center space-y-4", []);

	const messageClasses = useMemo(() => "text-lg font-semibold text-gray-800 animate-pulse", []);

	return (
		<div className={containerClasses}>
			<div className={contentClasses}>
				<div className={spinnerClasses} />
				<p className={messageClasses}>{LOADING_MESSAGE}</p>
			</div>
		</div>
	);
}
