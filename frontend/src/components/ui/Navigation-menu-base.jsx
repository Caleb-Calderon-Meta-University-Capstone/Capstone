// navigation-menu-base.jsx
// Converted from: shadcn/ui NavigationMenu (JavaScript + React)
// Source: https://ui.shadcn.com/components/navigation-menu
import React from "react";
import { cn } from "../../lib/utils";

export function navigationMenuTriggerStyle() {
	return cn("px-4 py-2 font-medium rounded-md hover:bg-gray-100 transition-colors");
}

export const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
	<nav ref={ref} className={cn("relative z-50 flex flex-col items-center", className)} {...props}>
		{children}
	</nav>
));
NavigationMenu.displayName = "NavigationMenu";

export const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => <ul ref={ref} className={cn("flex items-center gap-4", className)} {...props} />);
NavigationMenuList.displayName = "NavigationMenuList";

export const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => <li ref={ref} className={cn("relative group", className)} {...props} />);
NavigationMenuItem.displayName = "NavigationMenuItem";

export const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
	<button ref={ref} className={cn("inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring", className)} {...props}>
		{children}
	</button>
));
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export const NavigationMenuContent = React.forwardRef(({ className, children, ...props }, ref) => (
	<div ref={ref} className={cn("absolute left-0 top-full mt-2 w-max rounded-md border bg-white shadow-lg z-50", "opacity-0 pointer-events-none", "group-hover:opacity-100 group-hover:pointer-events-auto", "transition-opacity duration-200", className)} {...props}>
		{children}
	</div>
));
NavigationMenuContent.displayName = "NavigationMenuContent";

export const NavigationMenuLink = React.forwardRef(({ asChild = false, className, children, ...props }, ref) => {
	const Comp = asChild ? React.Fragment : "a";
	return asChild ? (
		<span className={cn("block", className)} {...props}>
			{children}
		</span>
	) : (
		<Comp ref={ref} className={cn("block px-4 py-2 text-sm hover:bg-gray-100 rounded-md", className)} {...props}>
			{children}
		</Comp>
	);
});
NavigationMenuLink.displayName = "NavigationMenuLink";
