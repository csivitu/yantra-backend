import { NextFunction, Request, Response } from 'express';
type asyncFunction = (req: Request, res: Response, next: NextFunction) => any;

const catchAsync =
    (fn: asyncFunction) =>
    (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch((err: Error) => {
            next(err);
        });
    };

export default catchAsync;
