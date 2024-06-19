import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import CustomerModel from '../../src/model/frontend/customers-model';

interface CustomRequest extends Request {
    user?: any;
}

const frontendAuthMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized - Missing Authorization header', status: false });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - Missing token', status: false });
        }
        const checkToken: any = jwt.verify(token, `${process.env.TOKEN_SECRET_KEY}`);

        if (checkToken?.userId) {
            const userData = await CustomerModel.findOne({ _id: checkToken.userId });
            if (userData) {
                req.user = userData;
                res.locals.user = userData;
                next();
            } else {
                return res.status(404).json({ message: 'User data not found!', status: false });
            }
        } else {
            return res.status(401).json({ message: 'Unauthorized - Invalid token', status: false, reLogin: true });
        }
    } catch (error) {
        console.error(error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ message: 'Invalid token', status: false });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default frontendAuthMiddleware;
