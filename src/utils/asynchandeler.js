const asynchandeler = (requesthandeler)=>{
         (req,res,next)=>{
            Promise.resolve(requesthandeler(req,res,next)).catch((error)=>next(error))
         }
}

export default asynchandeler;
// apan fakt aplya tya db chya index madye te async fun ahe na databse connection check karaych tya function la ghadighadi use karnyasathi ek wrapper banvtoy mhanje apan tyala kadhipan yachyamdye pass karvun multiple thikani use karu hskato res.send vaigre goshti 

// const asynchandeler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
