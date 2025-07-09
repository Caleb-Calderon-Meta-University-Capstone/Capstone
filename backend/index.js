const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabaseClient");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/users", async (req, res) => {
	try {
		const { data, error } = await supabase.from("users").select("*");
		if (error) {
			console.error("Supabase error:", error.message || error); 
			return res.status(500).json({
				message: "We ran into a problem while trying to fetch users. Please try again later.",
			});
		}
		res.json(data);
	} catch (err) {
		console.error("Unexpected error:", err); 
		res.status(500).json({
			message: "Something went wrong while processing your request. Please try again later.",
		});
	}
});

app.get("/events", async (req, res) => {
	const { data, error } = await supabase.from("events").select("*");
	if (error) return res.status(500).json({ error });
	res.json(data);
});

app.listen(3000, () => {
	console.log("Backend server running on http://localhost:3000");
});
