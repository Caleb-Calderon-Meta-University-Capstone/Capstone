import { CLUSTER_CATEGORY_MAPPINGS, CLUSTER_SIZE_THRESHOLDS, FALLBACK_NAMES } from "../constants/visualizationCategories";

export const getClusterColor = (index) => {
	const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
	return colors[index % colors.length];
};

export const analyzeClusterCharacteristics = (cluster, vectors) => {
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

export const calculateClusterDistances = (cluster, vectors) => {
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

export const getClusterName = (cluster, vectors) => {
	const characteristics = analyzeClusterCharacteristics(cluster, vectors);
	const topReasons = characteristics.topReasons.slice(0, 3);
	const topLocations = characteristics.topLocations.slice(0, 2);

	const categoryMappings = CLUSTER_CATEGORY_MAPPINGS;

	const createDescriptiveName = () => {
		const dominantCategories = [];

		topReasons.forEach((reason) => {
			const lowerReason = reason.toLowerCase();
			for (const [key, value] of Object.entries(categoryMappings)) {
				if (lowerReason.includes(key) && !dominantCategories.includes(value)) {
					dominantCategories.push(value);
				}
			}
		});

		topLocations.forEach((location) => {
			const cleanLocation = location.replace("loc:", "").toLowerCase();
			for (const [key, value] of Object.entries(categoryMappings)) {
				if (cleanLocation.includes(key) && !dominantCategories.includes(value)) {
					dominantCategories.push(value);
				}
			}
		});

		if (cluster.events.length >= CLUSTER_SIZE_THRESHOLDS.LARGE) {
			if (dominantCategories.length >= 2) {
				return `${dominantCategories.slice(0, 2).join(" & ")} Events`;
			} else if (dominantCategories.length === 1) {
				return `${dominantCategories[0]} Events`;
			} else {
				if (characteristics.avgDuration > 0.6) {
					return FALLBACK_NAMES.EXTENDED_LEARNING;
				} else if (characteristics.avgAttendance > 0.6) {
					return FALLBACK_NAMES.HIGH_IMPACT;
				} else {
					return FALLBACK_NAMES.DIVERSE_MIX;
				}
			}
		} else if (cluster.events.length >= CLUSTER_SIZE_THRESHOLDS.MEDIUM) {
			if (dominantCategories.length >= 1) {
				return `${dominantCategories[0]} Focus`;
			} else {
				return FALLBACK_NAMES.SPECIALIZED;
			}
		} else {
			if (dominantCategories.length >= 1) {
				return dominantCategories[0];
			} else {
				return FALLBACK_NAMES.NICHE;
			}
		}
	};

	const descriptiveName = createDescriptiveName();

	if (cluster.events.length >= CLUSTER_SIZE_THRESHOLDS.VERY_LARGE) {
		return `${descriptiveName} (${cluster.events.length} events)`;
	}

	return descriptiveName;
};

export const getClusterTooltip = (cluster, vectors) => {
	const characteristics = analyzeClusterCharacteristics(cluster, vectors);
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
