import { Request, Response, NextFunction } from 'express';

import PrivilagesService from '../../src/services/admin/account/privilages-service';
import UserTypeService from '../../src/services/admin/account/user-type-service'

interface CustomRequest extends Request {
    user?: any;
}

interface UserPermissionOptions {
    permissionBlock: string
    readOnly?: number | boolean;
    writeOnly?: number | boolean;
    deleteOnly?: number | boolean;
}

const userPermissionMiddleware = (options: UserPermissionOptions) => {
    return async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = res.locals.user;
            if ((user) && (req.user?.userTypeID)) {
                const userTypeId = req.user?.userTypeID;
                const userTypeData = await UserTypeService.findOne(userTypeId);
                if (userTypeData) {
                    if (userTypeData.slug === 'super-admin') {
                        next();
                    } else {
                        const privilages = await PrivilagesService.findOne(userTypeId); // Fetch privileges for the user
                        if ((privilages) && privilages?.menuItems) {
                            const { menuItems } = privilages;
                            for (const menuItem of menuItems) {
                                for (const privilageItem of menuItem.privilageItems) {
                                    const { privilageValue, menuKey } = privilageItem;

                                    if (privilageValue === options.permissionBlock) {
                                        if (
                                            (options.readOnly && menuKey.readOnly === options.readOnly) ||
                                            (options.writeOnly && menuKey.writeOnly === options.writeOnly) ||
                                            (options.deleteOnly && menuKey.deleteOnly === options.deleteOnly)
                                        ) {
                                            return next();
                                        }
                                    }
                                }
                            }
                            return res.status(403).json({ message: 'User does not have permission to access this resource. Please contact administrator!' });
                        } else {
                            return res.status(403).json({ message: 'User does not have permission to access this resource. Please contact administrator!' });
                        }
                    }
                } else {
                    return res.status(401).json({ message: 'User type not found for this user. Please try again another user or contact administrator!', status: false });
                }

            } else {
                return res.status(401).json({ message: 'User type not found for this user. Please try again another user or contact administrator!', status: false });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};

export default userPermissionMiddleware;