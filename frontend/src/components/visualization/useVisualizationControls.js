import { useRef } from "react";
import * as d3 from "d3";

export const useVisualizationControls = (svgRef, zoomRef, visualizationReady) => {
	const mainGroupRef = useRef(null);

	const zoomIn = () => {
		if (svgRef.current && zoomRef.current && visualizationReady) {
			try {
				const svg = d3.select(svgRef.current);
				const currentTransform = d3.zoomTransform(svgRef.current);
				const newScale = Math.min(currentTransform.k * 1.5, 15);
				const newTransform = d3.zoomIdentity.scale(newScale).translate(currentTransform.x, currentTransform.y);
				svg.call(zoomRef.current.transform, newTransform);
			} catch (error) {
				console.error("Error in zoomIn:", error);
			}
		}
	};

	const zoomOut = () => {
		if (svgRef.current && zoomRef.current && visualizationReady) {
			try {
				const svg = d3.select(svgRef.current);
				const currentTransform = d3.zoomTransform(svgRef.current);
				const newScale = Math.max(currentTransform.k / 1.5, 0.05);
				const newTransform = d3.zoomIdentity.scale(newScale).translate(currentTransform.x, currentTransform.y);
				svg.call(zoomRef.current.transform, newTransform);
			} catch (error) {
				console.error("Error in zoomOut:", error);
			}
		}
	};

	const resetZoom = () => {
		if (svgRef.current && zoomRef.current && visualizationReady) {
			try {
				const svg = d3.select(svgRef.current);
				const resetTransform = d3.zoomIdentity.scale(0.6);
				svg.call(zoomRef.current.transform, resetTransform);
			} catch (error) {
				console.error("Error in resetZoom:", error);
			}
		}
	};

	return { zoomIn, zoomOut, resetZoom, mainGroupRef };
};
