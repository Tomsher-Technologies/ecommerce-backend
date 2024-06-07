import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import CustomerModel from '../../src/model/frontend/customers-model';

interface CustomRequest extends Request {
    user?: any;
}

const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization');
        if (token) {
            const checkToken = token.split(' ')[1];
            const userData: any = jwt.verify(checkToken, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);
            if (userData) {
                req.user = userData;

                res.locals.user = userData;
                next();
            } else {
                return res.status(201).json({ message: 'User data not dound!', status: false });
            }
        } else {
            return res.status(201).json({ message: 'Unauthorized - Missing token', status: false });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default authMiddleware;
