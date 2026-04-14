import type { SVGProps } from "react";

// TheBrain logomark, mirrored from
// Vulcan/Vulcan.Shared/wwwroot/images/TheBrain-Logo-Mono.svg. Uses
// `currentColor` so the component picks up Tailwind text colour (e.g.
// `text-brand`) from its parent.
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 160 160"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			stroke="currentColor"
			strokeWidth={7.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			<path d="M55.182,80C55.182,91.414 45.915,100.682 34.501,100.682L26.228,100.682C14.814,100.682 5.546,91.414 5.546,80C5.546,68.586 14.814,59.318 26.228,59.318L34.501,59.318C45.915,59.318 55.182,68.586 55.182,80ZM75.864,59.318C64.449,59.318 55.182,50.051 55.182,38.637C55.182,27.222 64.449,17.955 75.864,17.955L84.136,17.955C95.551,17.955 104.818,27.222 104.818,38.637C104.818,50.051 114.085,59.318 125.499,59.318L133.772,59.318C145.186,59.318 154.454,68.586 154.454,80C154.454,91.414 145.186,100.682 133.772,100.682L125.499,100.682C114.085,100.682 104.818,109.949 104.818,121.363C104.818,132.778 95.551,142.045 84.136,142.045L75.864,142.045C64.449,142.045 55.182,132.778 55.182,121.363C55.182,109.949 64.449,100.682 75.864,100.682L84.136,100.682C95.551,100.682 104.818,91.414 104.818,80C104.818,68.586 95.551,59.318 84.136,59.318L75.864,59.318Z" />
		</svg>
	);
}
