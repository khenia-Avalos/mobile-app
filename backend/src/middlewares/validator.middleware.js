export const validateSchema = (schema) => (req,res,next)=>{

        const result = schema.safeParse(req.body)
        if(!result.success)return res.status(400).json(result.error.issues.map(issue => issue.message))
                
        next()
    
}