import { Request, Response, NextFunction } from 'express';
import AuthorisationModel from '@model/admin/authorisation-model'; // Ensure the correct export is used
import UserModel from '@model/admin/account/user-model';

interface CustomRequest extends Request {
  user?: any;
}

const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
      const existingUserAuth = await AuthorisationModel.findOne({ token: token });

      if (existingUserAuth) {
        const user = await UserModel.findOne({ _id: existingUserAuth.userID });
        if (user) {
          req.user = user;

          res.locals.user = user;
          next();
        } else {
          return res.status(201).json({ message: 'Inavlid user name or password!', status: false });
        }
      } else {
        return res.status(201).json({ message: 'Unauthorized - Invalid token', status: false });
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
