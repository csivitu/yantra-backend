import * as express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';
import * as path from 'path';
import helmet from 'helmet';
import * as ExpressMongoSanitize from 'express-mongo-sanitize';
import * as cors from 'cors';
import AppError from './managers/AppError';
import connectToDB from './managers/DB';
import envHandler from './managers/envHandler';

const app: Express = express();

app.use(express.json());

app.use(cors());

app.use(helmet());
app.use(ExpressMongoSanitize());

app.use(express.static(path.join(__dirname, '../public')));

if (envHandler('NODE_ENV') === 'dev') app.use(morgan('dev'));

connectToDB();

app.listen(envHandler('PORT'), () => {
    console.log(`Server is running on http://127.0.0.1:${process.env.PORT}`);
});

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

export default app;
