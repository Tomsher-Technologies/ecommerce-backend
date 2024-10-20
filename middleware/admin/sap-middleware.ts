import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import AuthorisationModel from '../../src/model/admin/authorisation-model'; // Ensure the correct export is used
import UserModel from '../../src/model/admin/account/user-model';

interface SapRequest extends Request {
    sapUser?: any;
}

const sapAuthMiddleware = async (req: SapRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            const checkToken: any = process.env.APP_AUTH_KEY === token;
            if (checkToken) {
                const user = await UserModel.findOne({ firstName: 'Sap' });
                const userData = {
                    _id: user?._id,
                    userTypeID: checkToken.userTypeID,
                    countryId: user?.countryId,
                    firstName: user?.firstName,
                    phone: user?.phone,
                    status: user?.status,
                }

                if (userData) {
                    req.sapUser = userData;
                    res.locals.sapUser = userData;
                    next();
                } else {
                    return res.status(201).json({ message: 'Invalid user name or password!', status: false, reLogin: false });
                }
            } else {
                return res.status(201).json({ message: 'Unauthorized - Invalid token', status: false, reLogin: true });
            }

        } else {
            return res.status(201).json({ message: 'Unauthorized - Missing token', status: false, reLogin: true });
        }
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(201).json({ message: 'Unauthorized - Token expired', status: false, reLogin: true });
        } else {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error', status: false, reLogin: false });
        }
    }
};

export default sapAuthMiddleware;
