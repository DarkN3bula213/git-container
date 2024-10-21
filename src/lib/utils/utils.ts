import type Role from '@/modules/auth/roles/role.model';
import { RoleModel } from '@/modules/auth/roles/role.model';
import type { RouteMap } from '@/types/routes';
import type { NextFunction, RequestHandler, Response, Router } from 'express';
import { IncomingMessage } from 'http';
import Joi from 'joi';
import { Types } from 'mongoose';
import QRCode from 'qrcode';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { logoutCookie } from '../config/cookies';
import { Roles } from '../constants';

export function setRouter(router: Router, routes: RouteMap[]): void {
	for (const route of routes) {
		const { path, method, handler, validations } = route;

		if (validations?.length) {
			router[method](path, ...validations, handler);
		} else {
			router[method](path, handler);
		}
	}
}

// Utility function to clear cookies
export const clearAuthCookies = (res: Response) => {
	res.cookie('access', '', logoutCookie);
};

export const normalizeRoles = (
	roles: Types.ObjectId[] | Role[] | string[] | string
): Types.ObjectId[] => {
	if (Array.isArray(roles)) {
		return roles.map((role) =>
			typeof role === 'string' ? new Types.ObjectId(role) : role._id
		);
	}
	return [
		typeof roles === 'string'
			? new Types.ObjectId(roles)
			: (roles as Role)._id
	];
};

export const isAdminRolePresent = async (
	userRoles: Types.ObjectId[]
): Promise<boolean> => {
	const adminRole = await RoleModel.findOne({
		_id: { $in: userRoles },
		code: Roles.ADMIN
	});
	return !!adminRole;
};

export const fetchRoleCodes = async (roleIds: Types.ObjectId[]) => {
	try {
		const roles = await RoleModel.find({
			_id: {
				$in: roleIds.map((id) => new Types.ObjectId(id))
			}
		}).select('code -_id');

		return roles.map((role) => role.code);
	} catch (error) {
		console.error('Error fetching role codes:', error);
		throw error;
	}
};

export const fetchUserPermissions = async (roleIds: Types.ObjectId[]) => {
	try {
		const roles = await RoleModel.find({
			_id: {
				$in: roleIds.map((id) => new Types.ObjectId(id))
			}
		});

		return roles.map((role) => role.code);
	} catch (error) {
		console.error('Error fetching role codes:', error);
		throw error;
	}
};

export async function generateQRCode(token: string): Promise<string> {
	try {
		const qrCodeDataURL = await QRCode.toDataURL(token);
		return qrCodeDataURL;
	} catch (err: any) {
		throw new Error('Error generating QR Code: ' + err.message);
	}
}

export const formatJoiErrorMessage = (
	errorDetails: Joi.ValidationErrorItem[]
): string => {
	return errorDetails
		.map((detail) => {
			// Replace multiple quotes with single quotes
			let message = detail.message.replace(/['"]+/g, '');

			// Capitalize the first letter of the message
			message = message.charAt(0).toUpperCase() + message.slice(1);

			// Add a space after periods and commas, if not already present
			message = message.replace(/([.,])(?=\S)/g, '$1 ');

			return message;
		})
		.join(' ');
};

export const wrap =
	(
		middleware: (
			arg0: IncomingMessage,
			arg1: object,
			arg2: NextFunction
		) => any
	) =>
	(socket: Socket, next: NextFunction) =>
		middleware(socket.request, {}, next);
export const wrapAsync =
	(
		fn: (
			arg0: Socket<
				DefaultEventsMap,
				DefaultEventsMap,
				DefaultEventsMap,
				any
			>,
			arg1: NextFunction
		) => Promise<any>
	) =>
	(socket: Socket, next: NextFunction) =>
		fn(socket, next).catch(next);

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Route {
	path: string;
	methods: Method[];
	handlers: RequestHandler[];
	validations?: RequestHandler[];
	[method: string]: RequestHandler[] | string | Method[] | undefined; // For method-specific middlewares like POST, GET
}

export type Routes = Route[];
export const registerRoutes = (router: Router, routes: Routes): void => {
	routes.forEach((route) => {
		const { path, methods, handlers, validations = [] } = route;

		methods.forEach((method, index) => {
			const methodSpecificMiddlewares =
				(route[method] as RequestHandler[]) || [];
			const allMiddlewares = [
				...validations,
				...methodSpecificMiddlewares
			];

			const handler = handlers[index]; // Get the corresponding handler for the method

			switch (method) {
				case 'GET':
					router.get(path, ...allMiddlewares, handler);
					break;
				case 'POST':
					router.post(path, ...allMiddlewares, handler);
					break;
				case 'PUT':
					router.put(path, ...allMiddlewares, handler);
					break;
				case 'DELETE':
					router.delete(path, ...allMiddlewares, handler);
					break;
				case 'PATCH':
					router.patch(path, ...allMiddlewares, handler);
					break;
				default:
					throw new Error(`Unsupported HTTP method: ${method}`);
			}
		});
	});
};

interface RouteMethod {
	handler: RequestHandler;
	validations?: RequestHandler[];
}
type Verbs = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouterMap {
	path: string;
	methods: {
		[key in Verbs]?: RouteMethod;
	};
}
export function mapRouter(router: Router, routes: RouterMap[]): void {
	for (const route of routes) {
		const { path, methods } = route;

		for (const method of Object.keys(methods) as Verbs[]) {
			const { handler, validations } = methods[method]!;

			if (validations?.length) {
				router[method](path, ...validations, handler);
			} else {
				router[method](path, handler);
			}
		}
	}
}
// This function is now designed to fetch all admin roles once
export const fetchAdminRoles = async (): Promise<Types.ObjectId | null> => {
	const adminRoles = await RoleModel.findOne({ code: Roles.ADMIN }).select(
		'_id'
	);
	return adminRoles?._id || null;
};
