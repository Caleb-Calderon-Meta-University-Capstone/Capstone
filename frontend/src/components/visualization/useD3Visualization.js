import { useCallback, useRef, useState } from "react";
import * as d3 from "d3";
import { getClusterName, getClusterTooltip } from "./clusterUtils";

export const useD3Visualization = (clusters, vectors) => {
	const svgRef = useRef(null);
	const zoomRef = useRef(null);
	const [visualizationReady, setVisualizationReady] = useState(false);

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
			const cols = Math.ceil(Math.sqrt(clusters.length));
			const row = Math.floor(index / cols);
			const col = index % cols;

			nodes.push({
				id: `cluster-${cluster.id}`,
				name: getClusterName(cluster, vectors),
				type: "cluster",
				color: cluster.color,
				size: Math.max(110, cluster.events.length * 25),
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
						.html(
							getClusterTooltip(
								clusters.find((c) => c.id === d.id.replace("cluster-", "")),
								vectors
							)
						);

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

	return { svgRef, zoomRef, visualizationReady, createVisualization };
};
