"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = __importDefault(require("../../src/model/admin/account/user-model"));
const sapAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            const checkToken = process.env.APP_AUTH_KEY === token;
            if (checkToken) {
                const user = await user_model_1.default.findOne({ firstName: 'Sap' });
                const userData = {
                    _id: user?._id,
                    userTypeID: checkToken.userTypeID,
                    countryId: user?.countryId,
                    firstName: user?.firstName,
                    phone: user?.phone,
                    status: user?.status,
                };
                if (userData) {
                    req.sapUser = userData;
                    res.locals.sapUser = userData;
                    next();
                }
                else {
                    return res.status(201).json({ message: 'Invalid user name or password!', status: false, reLogin: false });
                }
            }
            else {
                return res.status(201).json({ message: 'Unauthorized - Invalid token', status: false, reLogin: true });
            }
        }
        else {
            return res.status(201).json({ message: 'Unauthorized - Missing token', status: false, reLogin: true });
        }
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            return res.status(201).json({ message: 'Unauthorized - Token expired', status: false, reLogin: true });
        }
        else {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error', status: false, reLogin: false });
        }
    }
};
exports.default = sapAuthMiddleware;
