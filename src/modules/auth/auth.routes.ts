import { Router } from "express";
import * as controller from './auth.controller'
import { validate } from "@/lib/handlers/validate";
import schema from './auth.schema'
const router = Router() 

router
    .route('/login')
    .post(validate(schema.login), controller.login)



export default router