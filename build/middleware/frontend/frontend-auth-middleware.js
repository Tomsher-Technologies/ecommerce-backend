"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (token) {
            // const existingUserAuth = await AuthorisationModel.findOne({ token: token });
            // // console.log('existingUserAuth', existingUserAuth);
            // if (existingUserAuth) {
            //     const user = await CustomerModel.findOne({ _id: existingUserAuth.userID });
            //     if (user) {
            //         // await AuthorisationModel.findOneAndUpdate(
            //         //     { _id: existingUserAuth._id }, 
            //         //     { $inc: { loggedCounts: 1 }, lastLoggedOn: new Date() },  // increment last loggedCounts + 1
            //         //     { new: true, useFindAndModify: false } 
            //         // );
            //         req.user = user;
            //         res.locals.user = user;
            //         next();
            //     } else {
            //         return res.status(201).json({ message: 'Inavlid user name or password!', status: false });
            //     }
            // } else {
            //     return res.status(201).json({ message: 'Unauthorized - Invalid token', status: false });
            // }
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