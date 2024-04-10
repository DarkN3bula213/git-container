import asyncHandler from "@/lib/handlers/asyncHandler";
import { getSessions } from "./session.model";

export const getSessionData = asyncHandler(async (req, res) => {
    const data = await getSessions();
    res.status(200).json(data);
})