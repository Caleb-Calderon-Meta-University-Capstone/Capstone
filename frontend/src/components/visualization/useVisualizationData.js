import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { getUserFeedbackMap, getEventFeedbackVectors, clusterEventsKMeans } from "../../utils/feedbackUtils";
import { getClusterColor } from "./clusterUtils";

export const useVisualizationData = () => {
	const [loading, setLoading] = useState(true);
	const [clusters, setClusters] = useState([]);
	const [vectors, setVectors] = useState({});

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

	useEffect(() => {
		loadData();
	}, []);

	return { loading, clusters, vectors };
};
