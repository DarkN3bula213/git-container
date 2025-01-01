import { Method, RouteMap } from '@/types/routes';

function isDynamicPath(path: string): boolean {
	return path.includes(':');
}

export function validateRouteOrder(routes: RouteMap[]): void {
	const groupedByMethod = routes.reduce<Record<Method, RouteMap[]>>(
		(acc, route) => {
			acc[route.method] = acc[route.method] || [];
			acc[route.method].push(route);
			return acc;
		},
		{} as Record<Method, RouteMap[]>
	);

	for (const method of Object.keys(groupedByMethod) as Method[]) {
		const sortedRoutes = groupedByMethod[method]
			.map((route) => route.path)
			.sort((a, b) => {
				if (isDynamicPath(a) && !isDynamicPath(b)) return 1; // Dynamic routes go after static
				if (!isDynamicPath(a) && isDynamicPath(b)) return -1; // Static routes come first
				return 0; // No reordering for the same type
			});

		const originalPaths = groupedByMethod[method].map(
			(route) => route.path
		);
		if (JSON.stringify(originalPaths) !== JSON.stringify(sortedRoutes)) {
			throw new Error(
				`Invalid route order for method "${method}": Static routes must precede dynamic routes. Defined order: ${originalPaths.join(
					', '
				)}`
			);
		}
	}
}
