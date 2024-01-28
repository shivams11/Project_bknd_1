class Apierrors extends Error{
    constructor(
        Statuscode,
        message="Something went wrong !!",
        errors=[],
        statck
    ){
        super(message);
        this.Statuscode= Statuscode
        this.message=message
        this.data = null
        this.success =false
        this.errors=errors
        if(statck){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}

export {Apierrors}
