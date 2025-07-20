import { Instagram, Linkedin, Globe2 } from "lucide-react";

const SOCIAL_LINKS_DATA = [
	{
		href: "https://www.instagram.com/micspsu/?hl=en",
		icon: Instagram,
		label: "Instagram",
	},
	{
		href: "https://www.linkedin.com/company/penn-state-mics/?viewAsMember=true",
		icon: Linkedin,
		label: "LinkedIn",
	},
	{
		href: "https://colorstack-by-micspsu.framer.website/",
		icon: Globe2,
		label: "Website",
	},
];

export const socialLinks = SOCIAL_LINKS_DATA;

export const footerSocialLinks = SOCIAL_LINKS_DATA;

export const landingPageSocialLinks = SOCIAL_LINKS_DATA.map((link) => ({
	icon: link.icon,
	url: link.href,
	label: link.label,
}));
