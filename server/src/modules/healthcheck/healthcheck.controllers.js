/* Here we are using the ApiResponse to standardize our healthCheck response*/
import {ApiResponse} from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.handler.js";

/*
const healthCheck = async (req, res, next)=>{
    try {
        const user = await getUserFromDB() 
        res.status(200).json(
            new ApiResponse(200, {message: "Server working alright"})
        ); 
    } catch (error) {
        next(error)
    }
};

*/

const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, {message: "Server is running alright"})
    )
});


export { healthCheck };




