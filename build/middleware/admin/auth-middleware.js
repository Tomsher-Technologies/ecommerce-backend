"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../../src/model/admin/account/user-model"));
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            const checkToken = jsonwebtoken_1.default.verify(token, `${process.env.TOKEN_SECRET_KEY}`);
            console.log('checkToken', checkToken);
            if (checkToken) {
                const user = await user_model_1.default.findOne({ _id: checkToken.userId });
                const userData = {
                    _id: user?._id,
                    userTypeID: checkToken.userTypeID,
                    countryId: user?.countryId,
                    firstName: user?.firstName,
                    phone: user?.phone,
                    status: user?.status,
                };
                if (userData) {
                    req.user = userData;
                    res.locals.user = userData;
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
exports.default = authMiddleware;
