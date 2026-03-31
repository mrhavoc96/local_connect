import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getLandingPageSuggestions } from "./landing.service.js";

export const getLandingSuggestions = asyncHandler(async (req, res) => {

    const data = await getLandingPageSuggestions();

    return res.status(200).json(
        new ApiResponse(200, data, "Landing page suggestions fetched")
    );
});