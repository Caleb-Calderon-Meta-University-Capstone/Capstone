export async function addEventToGoogleCalendar(accessToken, event) {
	try {
		const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const startDate = new Date(event.date);
		const endDate = new Date(startDate.getTime() + (event.duration || 60) * 60000); 

		const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				summary: event.title,
				location: event.location,
				description: event.description,
				start: {
					dateTime: startDate.toISOString(),
					timeZone: userTimeZone,
				},
				end: {
					dateTime: endDate.toISOString(),
					timeZone: userTimeZone,
				},
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error("Google Calendar Error:", data);
			alert("Failed to add event to Google Calendar.");
		} else {
			alert("Event added to Google Calendar!");
		}
	} catch (err) {
		console.error("Error adding event:", err);
		alert("Something went wrong while adding the event.");
	}
}
