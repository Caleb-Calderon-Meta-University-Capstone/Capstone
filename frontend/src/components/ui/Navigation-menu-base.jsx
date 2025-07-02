import React from "react";
import { cn } from "../../lib/utils";

export function navigationMenuTriggerStyle() {
	return cn("px-4 py-2 font-semibold rounded-lg hover:bg-[#F5F5F5] transition-all duration-200 shadow-sm");
}

export const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
	<nav ref={ref} className={cn("relative z-50 flex flex-col items-center bg-white border-b shadow-md px-6 py-4 rounded-b-xl", className)} {...props}>
		{children}
	</nav>
));
NavigationMenu.displayName = "NavigationMenu";

export const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => <ul ref={ref} className={cn("flex items-center gap-6", className)} {...props} />);
NavigationMenuList.displayName = "NavigationMenuList";

export const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => <li ref={ref} className={cn("relative group", className)} {...props} />);
NavigationMenuItem.displayName = "NavigationMenuItem";

export const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
	<button ref={ref} className={cn("inline-flex items-center justify-center text-sm font-semibold text-gray-800 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary", className)} {...props}>
		{children}
	</button>
));
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export const NavigationMenuContent = React.forwardRef(({ className, children, ...props }, ref) => (
	<div ref={ref} className={cn("absolute left-0 top-full mt-2 w-max rounded-md border border-gray-200 bg-white shadow-xl z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200", className)} {...props}>
		{children}
	</div>
));
NavigationMenuContent.displayName = "NavigationMenuContent";

export const NavigationMenuLink = React.forwardRef(({ asChild = false, className, children, ...props }, ref) => {
	const Comp = asChild ? React.Fragment : "a";
	return asChild ? (
		<span className={cn("block text-gray-700", className)} {...props}>
			{children}
		</span>
	) : (
		<Comp ref={ref} className={cn("block px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors duration-150 text-gray-700", className)} {...props}>
			{children}
		</Comp>
	);
});
NavigationMenuLink.displayName = "NavigationMenuLink";
