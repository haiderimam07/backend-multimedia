// this is the utility to handle errors it jsut simply give info of the error

class ApiError extends Error{
    constructor(
            statusCode,
            message="something went wrong",
            errors=[],
            statck=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors=errors
    }
}
export {ApiError}