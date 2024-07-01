"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importDefault(require("../../../src/model/admin/account/user-model"));
const privilages_service_1 = __importDefault(require("./account/privilages-service"));
const user_type_model_1 = __importDefault(require("../../model/admin/account/user-type-model"));
class AuthService {
    async login(username, password) {
        try {
            const user = await user_model_1.default.findOne({ $and: [{ email: username }, { status: '1' }] }).populate('userTypeID', ['userTypeName', 'slug']);
            console.log('user', user);
            if (user.userTypeID.slug != "super-admin") {
                const userType = await user_type_model_1.default.findOne({ $and: [{ slug: user.userTypeID.slug }, { status: '1' }] });
                console.log(userType);
                if (!userType) {
                    throw new Error('User permission declined');
                }
            }
            if (user) {
                const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
                if (isPasswordValid) {
                    // const isPasswordValid: boolean = crypto.timingSafeEqual(
                    //     Buffer.from(password.trim()),
                    //     Buffer.from(user.password.trim())
                    // );
                    const token = jsonwebtoken_1.default.sign({
                        userId: user._id,
                        userTypeID: user.userTypeID,
                        countryId: user.countryId,
                        email: user.email,
                        phone: user.phone
                    }, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn: '8h' });
                    let insertedValues = {};
                    if (insertedValues) {
                        const privilages = await privilages_service_1.default.findOne(user.userTypeID);
                        return {
                            userID: insertedValues.userID,
                            userTypeId: user.userTypeID,
                            countryId: user.countryId,
                            firstName: user.firstName,
                            email: user.email,
                            phone: user.phone,
                            token,
                            expiresIn: insertedValues.expiresIn,
                            privilages
                        };
                    }
                    else {
                        throw new Error('Something went wrong. please try agaim!');
                    }
                }
                else {
                    throw new Error('Invalid password.');
                }
            }
            else {
                throw new Error('Invalid user name.');
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = new AuthService();
