import { Router } from 'express';
import * as controller from './user.controller';

const router = Router();

router.route('/')
    .get(controller.getUsers)
    .post(controller.register);

router.route('/:id')
    .get(controller.getUser)
    .put(controller.updateUser)
    .delete(controller.deleteUser);

export default (): Router => router;
