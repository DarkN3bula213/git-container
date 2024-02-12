import { Roles } from "@/lib/constants";
import { Logger as log} from "@/lib/logger";
import attachRoles from "@/middleware/attachRoles";
import { Router } from "express";
const Logger = new log(__filename)
const router = Router()


router.get('/',attachRoles(Roles.MASTER), (req, res) => {
    Logger.debug({
        attached: req.roles
    })   
    res.send('hello')
})

export default router 