import express, { Application } from 'express';
import middleware from './middleware/common';
import requireKey from './middleware/apiKey'
const app: Application = express();

requireKey(app)
middleware(app);


export { app };
