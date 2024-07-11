"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const privilages_service_1 = __importDefault(require("../../src/services/admin/account/privilages-service"));
const user_type_service_1 = __importDefault(require("../../src/services/admin/account/user-type-service"));
const userPermissionMiddleware = (options) => {
    return async (req, res, next) => {
        try {
            const user = res.locals.user;
            if ((user) && (req.user?.userTypeID)) {
                const userTypeId = req.user?.userTypeID;
                const userTypeData = await user_type_service_1.default.findOne(userTypeId);
                if (userTypeData) {
                    if (userTypeData.slug === 'super-admin') {
                        next();
                    }
                    else {
                        const privilages = await privilages_service_1.default.findOne(userTypeId); // Fetch privileges for the user
                        if ((privilages) && privilages?.menuItems) {
                            const { menuItems } = privilages;
                            for (const menuItem of menuItems) {
                                for (const privilageItem of menuItem.privilageItems) {
                                    const { privilageValue, menuKey } = privilageItem;
                                    if (privilageValue === options.permissionBlock) {
                                        if ((options.readOnly && menuKey.readOnly === options.readOnly) ||
                                            (options.writeOnly && menuKey.writeOnly === options.writeOnly) ||
                                            (options.deleteOnly && menuKey.deleteOnly === options.deleteOnly)) {
                                            return next();
                                        }
                                    }
                                }
                            }
                            return res.status(403).json({ message: 'User does not have permission to access this resource. Please contact administrator!' });
                        }
                        else {
                            return res.status(403).json({ message: 'User does not have permission to access this resource. Please contact administrator!' });
                        }
                    }
                }
                else {
                    return res.status(401).json({ message: 'User type not found for this user. Please try again another user or contact administrator!', status: false });
                }
            }
            else {
                return res.status(401).json({ message: 'User type not found for this user. Please try again another user or contact administrator!', status: false });
            }
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};
exports.default = userPermissionMiddleware;
