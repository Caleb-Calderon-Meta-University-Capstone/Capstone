const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabaseClient");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/users", async (req, res) => {
	const { data, error } = await supabase.from("users").select("*");
	if (error) return res.status(500).json({ message: error || "Unknown error"});
	res.json(data);
});

app.get("/events", async (req, res) => {
	const { data, error } = await supabase.from("events").select("*");
	if (error) return res.status(500).json({ error });
	res.json(data);
});

app.listen(3000, () => {
	console.log("Backend server running on http://localhost:3000");
});
