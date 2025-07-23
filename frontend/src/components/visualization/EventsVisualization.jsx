import React, { useState, useEffect, useCallback, useRef } from "react";
import * as d3 from "d3";
import { useNavigate } from "react-router-dom";
import { HelpCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import NavigationBar from "../NavigationBar";
import LoadingSpinner from "../LoadingSpinner";
import Footer from "../Footer";
import { supabase } from "../../supabaseClient";
import { getUserFeedbackMap, getEventFeedbackVectors, clusterEventsKMeans } from "../../utils/feedbackUtils";

const HelpTooltip = ({ children, className = "" }) => (
	<div className={`relative inline-block ${className}`}>
		<HelpCircle className="peer w-6 h-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
		<div className="pointer-events-none opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-900 text-sm rounded-lg shadow-lg p-4 z-50">
			<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-l border-t border-gray-200 rotate-45" />
			{children}
		</div>
	</div>
);

export default function EventsVisualization() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [clusters, setClusters] = useState([]);
	const [vectors, setVectors] = useState({});
	const [visualizationReady, setVisualizationReady] = useState(false);
	const svgRef = useRef(null);
	const zoomRef = useRef(null);
	const mainGroupRef = useRef(null);

	const loadData = async () => {
		try {
			setLoading(true);
			const { data: eventsData } = await supabase.from("events").select("*");
			if (!eventsData || eventsData.length === 0) {
				setLoading(false);
				return;
			}

			const feedbackMap = await getUserFeedbackMap();
			const eventIds = eventsData.map((e) => e.id);
			const vectors = await getEventFeedbackVectors(feedbackMap, eventIds);
			setVectors(vectors);

			const clusterMap = clusterEventsKMeans(vectors, 3);

			const clusterArray = Object.entries(clusterMap).map(([clusterId, eventIds]) => {
				const events = eventsData.filter((e) => eventIds.includes(String(e.id)));
				return {
					id: clusterId,
					events: events,
					color: getClusterColor(parseInt(clusterId)),
				};
			});

			setClusters(clusterArray);
			setLoading(false);
		} catch (error) {
			console.error("Error loading data:", error);
			setLoading(false);
		}
	};

	const getClusterColor = (index) => {
		const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
		return colors[index % colors.length];
	};

	const getClusterName = (cluster) => {
		const characteristics = analyzeClusterCharacteristics(cluster);
		const topReasons = characteristics.topReasons.slice(0, 2);

		const formatName = (str) => {
			return str
				.replace(/\b\w/g, (l) => l.toUpperCase())
				.replace(/\s+/g, " ")
				.trim();
		};

		const formattedReasons = topReasons.map(formatName).join(" ");

		return formattedReasons || "Mixed Feedback";
	};

	const getClusterTooltip = (cluster) => {
		const characteristics = analyzeClusterCharacteristics(cluster);
		return `
			<div class="max-w-sm">
				<div class="border-b border-gray-300 pb-2 mb-3">
					<h4 class="font-bold text-lg text-gray-900 mb-1">Cluster Analysis</h4>
					<p class="text-sm text-gray-600">${cluster.events.length} events grouped by feedback patterns</p>
				</div>
				
				<div class="space-y-3">
					<div>
						<h5 class="font-semibold text-gray-800 mb-1 flex items-center">
							<svg class="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							Top Feedback Reasons
						</h5>
						<div class="flex flex-wrap gap-1">
							${characteristics.topReasons.map((reason) => `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${reason}</span>`).join("")}
						</div>
					</div>
					
					<div>
						<h5 class="font-semibold text-gray-800 mb-1 flex items-center">
							<svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
							</svg>
							Location Types
						</h5>
						<div class="flex flex-wrap gap-1">
							${characteristics.topLocations
								.map((location) => {
									const cleanLocation = location.replace("loc:", "");
									return `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">${cleanLocation}</span>`;
								})
								.join("")}
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-3">
						<div>
							<h5 class="font-semibold text-gray-800 mb-1 flex items-center">
								<svg class="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
								</svg>
								Duration
							</h5>
							<span class="text-sm ${characteristics.avgDuration > 0.5 ? "text-purple-600 font-medium" : "text-gray-600"}">
								${characteristics.avgDuration > 0.5 ? "Long" : "Short"}
							</span>
						</div>
						<div>
							<h5 class="font-semibold text-gray-800 mb-1 flex items-center">
								<svg class="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
									<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
								</svg>
								Attendance
							</h5>
							<span class="text-sm ${characteristics.avgAttendance > 0.5 ? "text-orange-600 font-medium" : "text-gray-600"}">
								${characteristics.avgAttendance > 0.5 ? "High" : "Low"}
							</span>
						</div>
					</div>
					
					<div>
						<h5 class="font-semibold text-gray-800 mb-2 flex items-center">
							<svg class="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
							</svg>
							Events (${cluster.events.length})
						</h5>
						<div class="space-y-1">
							${cluster.events
								.slice(0, 4)
								.map((event) => `<div class="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">${event.title}</div>`)
								.join("")}
							${cluster.events.length > 4 ? `<div class="text-xs text-gray-500 italic px-2 py-1">... and ${cluster.events.length - 4} more</div>` : ""}
						</div>
					</div>
				</div>
			</div>
		`;
	};

	const analyzeClusterCharacteristics = (cluster) => {
		const feedbackReasons = {};
		const locationTypes = {};
		let totalDuration = 0;
		let totalAttendance = 0;
		let eventCount = 0;

		cluster.events.forEach((event) => {
			const eventId = String(event.id);
			const vector = vectors[eventId] || {};
			Object.keys(vector).forEach((key) => {
				if (!key.startsWith("loc:") && key !== "duration" && key !== "attendees") {
					feedbackReasons[key] = (feedbackReasons[key] || 0) + vector[key];
				}
			});

			Object.keys(vector).forEach((key) => {
				if (key.startsWith("loc:")) {
					locationTypes[key] = (locationTypes[key] || 0) + vector[key];
				}
			});
			if (vector.duration !== undefined) {
				totalDuration += vector.duration;
				eventCount++;
			}
			if (vector.attendees !== undefined) {
				totalAttendance += vector.attendees;
			}
		});

		const topReasons = Object.entries(feedbackReasons)
			.sort(([, a], [, b]) => b - a)
			.map(([reason]) => reason);

		const topLocations = Object.entries(locationTypes)
			.sort(([, a], [, b]) => b - a)
			.map(([location]) => location);

		return {
			topReasons,
			topLocations,
			avgDuration: eventCount > 0 ? totalDuration / eventCount : 0,
			avgAttendance: eventCount > 0 ? totalAttendance / eventCount : 0,
		};
	};

	const calculateClusterDistances = (cluster) => {
		const clusterVectors = cluster.events.map((event) => {
			const eventId = String(event.id);
			return vectors[eventId] || {};
		});

		const features = Object.keys(clusterVectors[0] || {});
		const centroid = features.map((feature) => {
			const sum = clusterVectors.reduce((acc, vec) => acc + (vec[feature] || 0), 0);
			return sum / clusterVectors.length;
		});

		const distances = clusterVectors.map((vec, i) => {
			const vecArray = features.map((f) => vec[f] || 0);
			return {
				eventId: cluster.events[i].id,
				distance: Math.sqrt(vecArray.reduce((sum, v, j) => sum + (v - centroid[j]) ** 2, 0)),
			};
		});

		return { centroid, distances };
	};

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

	const createVisualization = useCallback(() => {
		if (!clusters.length || !svgRef.current || Object.keys(vectors).length === 0) return;

		d3.select(svgRef.current).selectAll("*").remove();

		const width = 1400;
		const height = 1200; 
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };

		const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);


		const nodes = [];
		const links = [];

		clusters.forEach((cluster, index) => {
			const characteristics = analyzeClusterCharacteristics(cluster);
			const distances = calculateClusterDistances(cluster);

	
			const cols = Math.ceil(Math.sqrt(clusters.length));
			const row = Math.floor(index / cols);
			const col = index % cols;

			nodes.push({
				id: `cluster-${cluster.id}`,
				name: getClusterName(cluster),
				type: "cluster",
				color: cluster.color,
				size: Math.max(110, cluster.events.length * 25),
				characteristics: characteristics,
				x: width * 0.2 + (col * width * 0.6) / (cols - 1),
				y: height * 0.2 + (row * height * 0.6) / (Math.ceil(clusters.length / cols) - 1),
			});
			cluster.events.forEach((event, eventIndex) => {
				const eventId = String(event.id);
				const vector = vectors[eventId] || {};
				nodes.push({
					id: `event-${event.id}`,
					name: event.title,
					type: "event",
					color: cluster.color,
					size: 80,
					clusterId: cluster.id,
					vector: vector,
				});
				links.push({
					source: `cluster-${cluster.id}`,
					target: `event-${event.id}`,
					color: cluster.color,
				});
			});
		});

		const simulation = d3
			.forceSimulation(nodes)
			.force(
				"link",
				d3
					.forceLink(links)
					.id((d) => d.id)
					.distance(150)
			)
			.force("charge", d3.forceManyBody().strength(-500).distanceMax(200))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force(
				"collision",
				d3.forceCollide().radius((d) => d.size + 20)
			);

		const mainGroup = svg.append("g");

		const zoom = d3
			.zoom()
			.scaleExtent([0.05, 15])
			.on("zoom", (event) => {
				mainGroup.attr("transform", event.transform);
			});
		svg.call(zoom);
		svg.call(zoom.transform, d3.zoomIdentity.scale(0.6));

		zoomRef.current = zoom;
		mainGroupRef.current = mainGroup;

		setVisualizationReady(true);

		const link = mainGroup
			.append("g")
			.selectAll("line")
			.data(links)
			.enter()
			.append("line")
			.attr("stroke", (d) => d.color)
			.attr("stroke-width", 2)
			.attr("stroke-opacity", 0.6);

		const node = mainGroup.append("g").selectAll("g").data(nodes).enter().append("g");

		node
			.append("circle")
			.attr("r", (d) => d.size)
			.attr("fill", (d) => d.color)
			.attr("stroke", "#ffffff")
			.attr("stroke-width", (d) => (d.type === "cluster" ? 3 : 2))
			.on("mouseover", function (event, d) {
				if (d.type === "cluster") {
					const tooltip = d3
						.select("body")
						.append("div")
						.attr("class", "tooltip")
						.style("position", "absolute")
						.style("background", "white")
						.style("color", "#374151")
						.style("padding", "16px")
						.style("border-radius", "8px")
						.style("font-size", "14px")
						.style("pointer-events", "none")
						.style("z-index", "1000")
						.style("box-shadow", "0 10px 25px rgba(0, 0, 0, 0.15)")
						.style("border", "1px solid #e5e7eb")
						.style("max-width", "400px")
						.style("backdrop-filter", "blur(10px)")
						.html(getClusterTooltip(clusters.find((c) => c.id === d.id.replace("cluster-", ""))));

					tooltip.style("left", event.pageX + 15 + "px").style("top", event.pageY - 15 + "px");
				}
			})
			.on("mouseout", function () {
				d3.selectAll(".tooltip").remove();
			});

		node
			.append("text")
			.text((d) => (d.name.length > 25 ? d.name.substring(0, 25) + "..." : d.name))
			.attr("text-anchor", "middle")
			.attr("dy", (d) => (d.type === "cluster" ? "0.35em" : "0.35em"))
			.attr("font-size", (d) => (d.type === "cluster" ? "14px" : "16px"))
			.attr("font-weight", (d) => (d.type === "cluster" ? "bold" : "normal"))
			.attr("fill", "white")
			.attr("stroke", "black")
			.attr("stroke-width", "1px")
			.attr("paint-order", "stroke fill");

		simulation.on("tick", () => {
			link
				.attr("x1", (d) => d.source.x)
				.attr("y1", (d) => d.source.y)
				.attr("x2", (d) => d.target.x)
				.attr("y2", (d) => d.target.y);

			node.attr("transform", (d) => `translate(${d.x},${d.y})`);
		});
	}, [clusters, vectors]);

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if (clusters.length > 0) {
			createVisualization();
		}
	}, [clusters, createVisualization]);

	return (
		<div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 min-h-screen">
			<NavigationBar active="events" />
			<div className="py-8 px-4 max-w-7xl mx-auto">
				<div className="text-center mb-6">
					<div className="flex items-center justify-center gap-2 mb-2">
						<h1 className="text-3xl font-bold text-gray-900">Event Clusters Visualization</h1>
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
					<p className="text-gray-600 mb-4">Explore how events are grouped based on user feedback patterns and preferences</p>
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
						<div className="absolute top-4 right-4 flex gap-2 z-10">
							<button
								onClick={() => {
									zoomIn();
								}}
								className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
								title="Zoom In"
							>
								<ZoomIn size={20} />
							</button>
							<button
								onClick={() => {
									zoomOut();
								}}
								className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
								title="Zoom Out"
							>
								<ZoomOut size={20} />
							</button>
							<button
								onClick={() => {
									resetZoom();
								}}
								className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
								title="Reset Zoom"
							>
								<RotateCcw size={20} />
							</button>
						</div>
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
