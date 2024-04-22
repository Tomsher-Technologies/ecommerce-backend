import 'module-alias/register';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import UserModel, { UserProps } from '@model/admin/account/user-model';
import AuthorisationModel from '@model/admin/authorisation-model';

class AuthService {
    async login(username: string, password: string): Promise<any> {
        try {
            const user: UserProps | null = await UserModel.findOne({ email: username });

            if (user) {
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (isPasswordValid) {
                    // const isPasswordValid: boolean = crypto.timingSafeEqual(
                    //     Buffer.from(password.trim()),
                    //     Buffer.from(user.password.trim())
                    // );

                    const token: string = jwt.sign({
                        userId: user._id,
                        email: user.email,
                        phone: user.phone
                    }, 'your-secret-key', { expiresIn: '1h' });

                    const existingUserAuth: any = await AuthorisationModel.findOne({ userID: user._id });
                    let insertedValues: any = {};
                    if (existingUserAuth) {
                        existingUserAuth.token = token;
                        insertedValues = await existingUserAuth.save();
                    } else {
                        const authorisationValues = new AuthorisationModel({
                            userID: user._id,
                            userTypeID: user?.userTypeID,
                            token,
                            expiresIn: '1h',
                            createdOn: new Date(),
                        });

                        insertedValues = await authorisationValues.save();
                    }

                    return insertedValues;
                } else {
                    throw new Error('Invalid password.');
                }

            } else {
                throw new Error('Invalid user name.');
            }
        } catch (error) {
            throw error;
        }
    }
}

export default new AuthService();
