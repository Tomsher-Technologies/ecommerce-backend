import 'module-alias/register';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import UserModel, { UserProps } from '../../../src/model/admin/account/user-model';
import AuthorisationModel from '../../../src/model/admin/authorisation-model';
import PrivilagesService from './account/privilages-service';
import UserTypeModel from '../../model/admin/account/user-type-model';
import CountryModel from '../../model/admin/setup/country-model';
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import { blockReferences } from '../../constants/website-setup';

class AuthService {
    async login(username: string, password: string): Promise<any> {
        try {
            const user: UserProps | null | any = await UserModel.findOne({ $and: [{ email: username }, { status: '1' }] }).populate('userTypeID', ['userTypeName', 'slug']);
            if(!user){
                throw new Error('Invalid user name or password!');
            }
            if (user.userTypeID.slug != "super-admin") {
                const userType = await UserTypeModel.findOne({ $and: [{ slug: user.userTypeID.slug }, { status: '1' }] })
                if (!userType) {
                    throw new Error('User permission declined');
                }
            }

            if (user) {
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (isPasswordValid) {
                    // const isPasswordValid: boolean = crypto.timingSafeEqual(
                    //     Buffer.from(password.trim()),
                    //     Buffer.from(user.password.trim())
                    // );
                    let websiteLogoUrl = ''
                    const countryDetails: any = await CountryModel.findOne({ isOrigin: true });
                    if (countryDetails) {
                        const websiteDetails: any = await WebsiteSetupModel.findOne({ countryId: countryDetails._id, blockReference: blockReferences.websiteSettings });
                        if (websiteDetails && websiteDetails?.blockValues && websiteDetails?.blockValues?.websiteLogoUrl)
                            websiteLogoUrl = websiteDetails?.blockValues?.websiteLogoUrl
                    }

                    const token: string = jwt.sign({
                        userId: user._id,
                        userTypeID: user.userTypeID,
                        countryId: user.countryId,
                        email: user.email,
                        phone: user.phone
                    }, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn: '8h' });

                    let insertedValues: any = {};

                    if (insertedValues) {
                        const privilages = await PrivilagesService.findOne(user.userTypeID as any);

                        return {
                            userID: insertedValues.userID,
                            userTypeId: user.userTypeID,
                            countryId: user.countryId,
                            firstName: user.firstName,
                            email: user.email,
                            phone: user.phone,
                            token,
                            expiresIn: insertedValues.expiresIn,
                            privilages,
                            websiteLogoUrl
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
