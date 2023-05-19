import * as express from 'express';
import { getGoogleAuthURL, getUser } from '../controllers/authController';

const userRouter = express.Router();

userRouter.get('/google', getGoogleAuthURL);

userRouter.get('/google/callback', getUser);

export default userRouter;
