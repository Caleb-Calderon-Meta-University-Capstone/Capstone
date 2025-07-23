import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../NavigationBar";
import LoadingSpinner from "../LoadingSpinner";
import Footer from "../Footer";
import HelpTooltip from "./HelpTooltip";
import VisualizationControls from "./VisualizationControls";
import { useVisualizationData } from "./useVisualizationData";
import { useD3Visualization } from "./useD3Visualization";
import { useVisualizationControls } from "./useVisualizationControls";

export default function EventsVisualization() {
	const navigate = useNavigate();

	const { loading, clusters, vectors } = useVisualizationData();
	const { svgRef, zoomRef, visualizationReady, createVisualization } = useD3Visualization(clusters, vectors);
	const { zoomIn, zoomOut, resetZoom } = useVisualizationControls(svgRef, zoomRef, visualizationReady);

	useEffect(() => {
		if (clusters.length > 0) {
			createVisualization();
		}
	}, [clusters, createVisualization]);

	return (
		<div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white min-h-screen">
			<NavigationBar active="events" />
			<div className="py-8 px-4 max-w-7xl mx-auto">
				<div className="text-center mb-6">
					<div className="flex items-center justify-center gap-4 mb-2">
						<img src="/MICS_Colorstack_Logo_Light.png" alt="MICS by ColorStack" className="h-16 w-auto mr-4" />
						<h1 className="text-5xl font-black text-white tracking-tight">Event Clusters Visualization</h1>
						<HelpTooltip>
							<div className="space-y-2">
								<p>
									<strong>How the Visualization Works:</strong>
								</p>
								<p>
									• <strong>Large circles</strong> represent clusters of similar events based on user feedback
								</p>
								<p>
									• <strong>Small circles</strong> are individual events connected to their cluster
								</p>
								<p>
									• <strong>Hover over clusters</strong> to see detailed feedback patterns
								</p>
								<p>
									• <strong>Events are grouped</strong> by what users liked about them (networking, learning, social, etc.)
								</p>
								<p>
									• <strong>Drag to move</strong> and <strong>scroll to zoom</strong> for better exploration
								</p>
							</div>
						</HelpTooltip>
					</div>
					<p className="text-gray-200 mb-4">Explore how events are grouped based on user feedback patterns and preferences</p>
					<div className="flex justify-start">
						<button onClick={() => navigate("/events")} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors">
							← Back to Events
						</button>
					</div>
				</div>

				{loading ? (
					<LoadingSpinner />
				) : (
					<div className="bg-white rounded-lg shadow-lg p-4 relative">
						<VisualizationControls onZoomIn={zoomIn} onZoomOut={zoomOut} onResetZoom={resetZoom} />
						<div className="w-full overflow-auto">
							<svg ref={svgRef} className="w-full h-full"></svg>
						</div>
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}
