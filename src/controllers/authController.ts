import envHandler from '../managers/envHandler';
import { google } from 'googleapis';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/userModel';
import { Response, Request, NextFunction } from 'express';
import catchAsync from '../managers/catchAsync';

export const createSendToken = (
    user: UserDocument,
    statusCode: number,
    res: Response
) => {
    const token = jwt.sign({ id: user._id }, envHandler('JWT_KEY'), {
        expiresIn: Number(envHandler('JWT_TIME')) * 24 * 60,
    });

    const cookieSettings = {
        expires: new Date(
            Date.now() + Number(envHandler('JWT_TIME')) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: false,
    };

    if (envHandler('NODE_ENV') === 'prod') cookieSettings.secure = true;

    res.cookie('token', token, cookieSettings);
    res.status(statusCode).json({
        status: 'success',
        token,
        user,
    });
};

const oauth2Client = new google.auth.OAuth2(
    envHandler('GOOGLE_CLIENT_ID'),
    envHandler('GOOGLE_CLIENT_SECRET'),
    'http://localhost:8000/auth/google/callback'
);

export const getGoogleAuthURL = catchAsync(
    (req: Request, res: Response, next: NextFunction) => {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ];

        const URL = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
        });

        res.redirect(URL);
    }
);

export const getUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const code = req.query.code as string;

        const { tokens } = await oauth2Client.getToken(code);

        const googleUser = await axios
            .get(
                `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens.id_token}`,
                    },
                }
            )
            .then((res) => res.data)
            .catch((error) => {
                throw new Error(error.message);
            });

        const VITEmailFormat =
            /^[a-zA-Z]+.[a-zA-Z]+20[0,1,2][0-9]@vitstudent.ac.in/;
        if (!googleUser.email.match(VITEmailFormat))
            res.status(401).json({
                message: 'Only VIT Students Allowed',
            });
        else {
            const user = await User.findOne({ email: googleUser.email });
            if (!user) {
                const newUser = await User.create({
                    name: googleUser.name,
                    email: googleUser.email,
                    profilePic: googleUser.picture,
                });
                createSendToken(newUser, 200, res);
            } else createSendToken(user, 200, res);
        }
    }
);
