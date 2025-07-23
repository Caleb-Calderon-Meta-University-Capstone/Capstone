import React from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const VisualizationControls = ({ onZoomIn, onZoomOut, onResetZoom }) => (
	<div className="absolute top-4 right-4 flex gap-2 z-10">
		<button onClick={onZoomIn} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors" title="Zoom In">
			<ZoomIn size={20} />
		</button>
		<button onClick={onZoomOut} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors" title="Zoom Out">
			<ZoomOut size={20} />
		</button>
		<button onClick={onResetZoom} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors" title="Reset Zoom">
			<RotateCcw size={20} />
		</button>
	</div>
);

export default VisualizationControls;
