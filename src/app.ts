import express, { Application } from 'express';
import { errorHandler } from './lib/handlers/errorHandler';

const app: Application = express();

app.use(errorHandler);

export { app };
