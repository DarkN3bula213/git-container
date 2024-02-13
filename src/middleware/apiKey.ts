
import { Application,Router } from 'express';
import useApiKey from './useApiKey';

export default (app: Application) => {
    const router = Router();
    router.use(useApiKey)
    app.use(router)
} 