import { Roles } from '@/lib/constants';
import { Logger as log } from '@/lib/logger';
import attachRoles from '@/middleware/attachRoles';
import { authentication } from '@/middleware/authMiddleware';

import { authorize } from '@/middleware/authorize';

import { Router } from 'express';
const Logger = new log(__filename);
const router = Router();

router.use(authentication, authorize(Roles.HPS));

router.get('/', attachRoles(Roles.ADMIN), (req, res) => {
   Logger.debug({
      attached: req.roles
   });
   res.json({
      data: {
         roles: req.roles
      }
   });
});

export default router;
