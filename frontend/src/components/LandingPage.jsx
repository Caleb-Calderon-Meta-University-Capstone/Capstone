import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Instagram, Linkedin, Globe2 } from "lucide-react";
import Footer from "./Footer";

const features = [
	{
		title: "Mentor Matching",
		description: "Recommendations to connect with the ideal mentors.",
		gradient: "from-teal-400 to-cyan-500",
	},
	{
		title: "Event Discovery",
		description: "Personalized reccomendations to find events such as hackathons, talks, and socials tailored to you.",
		gradient: "from-amber-400 to-orange-500",
	},
	{
		title: "Growth Points",
		description: "Earn and redeem points to unlock exclusive perks.",
		gradient: "from-fuchsia-500 to-pink-500",
	},
];

const partners = [
	{ name: "EY", domain: "ey.com" },
	{ name: "Emerson", domain: "emerson.com" },
	{ name: "FedEx", domain: "fedex.com" },
	{ name: "HackPSU", domain: "hackpsu.org" },
	{ name: "Lockheed Martin", domain: "lockheedmartin.com" },
	{ name: "J.P. Morgan", domain: "jpmorganchase.com" },
];

const socialLinks = [
	{ icon: Instagram, url: "https://www.instagram.com/micspsu/?hl=en", label: "Instagram" },
	{ icon: Linkedin, url: "https://www.linkedin.com/company/penn-state-mics/", label: "LinkedIn" },
	{ icon: Globe2, url: "https://colorstack-by-micspsu.framer.website/", label: "Website" },
];

export default function LandingPage() {
	const { scrollYProgress } = useScroll();
	const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

	return (
		<>
			<motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left z-50" />

			<div className="w-full text-gray-800 scroll-smooth snap-y snap-mandatory">
				<motion.section className="snap-start relative h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 text-white overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
					<motion.div className="absolute -left-40 -top-20 w-[600px] h-[600px] rounded-full bg-white/15 blur-3xl" style={{ translateY: useTransform(scrollYProgress, [0, 0.5], [0, -200]) }} />
					<motion.div className="absolute right-8 bottom-8 w-72 h-72 bg-white/10 rotate-45 blur-2xl" style={{ translateY: useTransform(scrollYProgress, [0, 0.5], [0, 200]) }} />

					<motion.div className="z-10 text-center px-6" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
						<div className="flex items-center justify-center mb-4">
							<img src="/MICS_Colorstack_Logo.png" alt="MICS by ColorStack" className="h-24 w-auto drop-shadow-lg mr-4" />
							<h1 className="text-5xl md:text-7xl font-extrabold drop-shadow-lg">MICS Connect</h1>
						</div>
						<p className="max-w-2xl mx-auto text-lg md:text-2xl font-light mb-6">Empowering underrepresented talent through mentorship, collaboration, and innovation.</p>
						<Link to="/signup" className="inline-block bg-white/90 text-indigo-700 font-semibold py-3 px-8 rounded-full shadow-lg backdrop-blur-sm hover:bg-white transition-all">
							Join the Community ↗
						</Link>
					</motion.div>
				</motion.section>

				<motion.section className="snap-start bg-white py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8 }}>
					<div className="max-w-4xl mx-auto text-center px-6">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Our Mission</h2>
						<motion.div className="relative mb-6 overflow-hidden rounded-2xl shadow-lg" initial={{ y: 100, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}>
							<img src="https://framerusercontent.com/images/cY57kUErTqkdA3k0PSHCd0e3B8.jpg" alt="Students collaborating" className="w-full h-auto object-cover" />
							<div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />
						</motion.div>
						<p className="text-lg md:text-xl leading-relaxed text-gray-700"> Multicultural Innovators in Computer Sciences fosters an inclusive community that empowers individuals from diverse backgrounds to excel in the computer sciences. Through mentorship, collaboration, and innovation, we aim to inspire change and promote diversity in the tech industry.</p>
					</div>
				</motion.section>

				<motion.section className="snap-start bg-gray-50 border-t py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
					<div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3 px-6">
						{features.map(({ title, description, gradient }, idx) => (
							<motion.div key={idx} className="group relative rounded-2xl overflow-hidden shadow-xl" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
								<div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-100 transition-all`} />
								<div className="relative bg-white/90 backdrop-blur-sm p-6 h-full">
									<h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
									<p className="text-gray-600 leading-relaxed">{description}</p>
								</div>
							</motion.div>
						))}
					</div>
				</motion.section>

				<motion.section className="snap-start bg-white border-t py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }}>
					<div className="max-w-6xl mx-auto text-center px-6">
						<h2 className="text-4xl md:text-5xl font-bold mb-8">Our Partners</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 place-items-center">
							{partners.map(({ name, domain }) => (
								<motion.img key={name} src={`https://logo.clearbit.com/${domain}?size=300`} alt={name} loading="lazy" className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition duration-300" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 * partners.indexOf({ name, domain }) }} />
							))}
						</div>
					</div>
				</motion.section>

				<motion.section className="snap-start relative h-[60vh] bg-fixed bg-center bg-cover flex items-center justify-center" style={{ backgroundImage: `url('https://framerusercontent.com/images/innYaqLJmI0CZO3wIsZciNcP6g.png')` }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }}>
					<div className="absolute inset-0 bg-black/30" />
					<motion.h2 className="text-white text-4xl md:text-6xl font-extrabold drop-shadow-lg z-10" initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
						Code • Connect • Community
					</motion.h2>
				</motion.section>

				<motion.section className="snap-start bg-white border-t py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }}>
					<div className="max-w-4xl mx-auto text-center px-6">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">A Home for Every Coder</h2>
						<p className="text-lg md:text-xl text-gray-700 mb-6">From first-time debuggers to system architects, MICS Connect is your hub to learn, share, and thrive.</p>
						<Link to="/events" className="inline-block bg-indigo-600 text-white font-semibold py-3 px-10 rounded-full shadow hover:bg-indigo-700 transition-all">
							Explore the Community ↗
						</Link>
					</div>
				</motion.section>

				<motion.section className="snap-start relative overflow-hidden bg-gradient-to-r from-indigo-700 to-blue-600 py-16 text-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
					<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80')] bg-cover opacity-10" />
					<div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-6">
						<h3 className="text-2xl md:text-3xl font-extrabold max-w-xl">Ready to level up your CS journey?</h3>
						<Link to="/signup" className="bg-white text-indigo-700 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-all">
							Get Started Now
						</Link>
					</div>
				</motion.section>
				<Footer />
			</div>
		</>
	);
}
