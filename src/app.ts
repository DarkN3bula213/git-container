import express, { Application } from 'express';
import middleware from './middleware/common';

const app: Application = express();

middleware(app);

export { app };
