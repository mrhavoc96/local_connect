/** This is a higher order wrapper function,
 * 
 * it takes the input as a function (requestHanlder from 
 * healthCheck.routes.js) and returns a function as it's output
 * This function handles the  
 * 
 * NOTE: This is a general function that can be used in any of the projects. 
 * */ 

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
};


export { asyncHandler };