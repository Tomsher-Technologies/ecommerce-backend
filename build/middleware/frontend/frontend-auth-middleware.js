"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (token) {
            const checkToken = token.split(' ')[1];
            const userData = jsonwebtoken_1.default.verify(checkToken, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);
            if (userData) {
                req.user = userData;
                res.locals.user = userData;
                next();
            }
            else {
                return res.status(201).json({ message: 'User data not dound!', status: false });
            }
        }
        else {
            return res.status(201).json({ message: 'Unauthorized - Missing token', status: false });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.default = authMiddleware;
