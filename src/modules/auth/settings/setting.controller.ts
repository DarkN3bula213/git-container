import asyncHandler from "@/lib/handlers/asyncHandler";
import settingsService from "./settings.service";
import { SuccessResponse } from "@/lib/api/ApiResponse";

import { BadRequestError } from "@/lib/api/ApiError";
import { User } from "../users/user.model";

export const updateSetting = asyncHandler(
	async (req, res) => {
		const user = req.user as User;
		if (!user) {    
			return new BadRequestError('User not found');
		}
		const settings = await settingsService.updateSetting(
			user._id,
			req.params.path,
			req.body.value
		);
		return new SuccessResponse(
			'Setting updated successfully',
			        settings
		).send(res);
	}
);
