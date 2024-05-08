import 'module-alias/register';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import UserModel, { UserProps } from '@model/admin/account/user-model';
import AuthorisationModel from '@model/admin/authorisation-model';
import PrivilagesService from './account/privilages-service';

class AuthService {
    async login(username: string, password: string): Promise<any> {
        try {
            const user: UserProps | null = await UserModel.findOne({ email: username }).populate('userTypeID', ['userTypeName', 'slug']);

            if (user) {
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (isPasswordValid) {
                    // const isPasswordValid: boolean = crypto.timingSafeEqual(
                    //     Buffer.from(password.trim()),
                    //     Buffer.from(user.password.trim())
                    // );

                    const token: string = jwt.sign({
                        userId: user._id,
                        userTypeID: user.userTypeID,
                        countryId: user.countryId,
                        email: user.email,
                        phone: user.phone
                    }, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn: '8h' });

                    const existingUserAuth: any = await AuthorisationModel.findOne({ userID: user._id });

                    let insertedValues: any = {};
                    if (existingUserAuth) {
                        existingUserAuth.token = token;
                        insertedValues = await existingUserAuth.save();
                    } else {
                        const authorisationValues = new AuthorisationModel({
                            userID: user._id,
                            userTypeId: user?.userTypeID,
                            token,
                            expiresIn: '1h',
                            createdOn: new Date(),
                        });
                        insertedValues = await authorisationValues.save();
                    }
                    if (insertedValues) {
                        const privilages = await PrivilagesService.findOne(user.userTypeID as any);

                        return {
                            userID: insertedValues.userID,
                            userTypeId: user.userTypeID,
                            countryId: user.countryId,
                            firstName: user.firstName,
                            email: user.email,
                            phone: user.phone,
                            token: insertedValues.token,
                            expiresIn: insertedValues.expiresIn,
                            privilages
                        }
                    } else {
                        throw new Error('Something went wrong. please try agaim!');
                    }

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
