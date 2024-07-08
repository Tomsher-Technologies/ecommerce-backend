import 'module-alias/register';
import { Request, Response } from 'express';
import AuthService from '../../services/admin/auth-service';
import BaseController from '../../../src/controllers/admin/base-controller';
import LanguagesService from '../../../src/services/admin/setup/languages-service';

class AuthController extends BaseController {
    constructor() {
        super();
        this.login = this.login.bind(this);
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;
            const insertedValues = await AuthService.login(username, password);
            if (insertedValues) {

                const languages = await LanguagesService.findAll({
                    query: { status: '1' },
                });
                // console.log('languages', languages);

                this.sendSuccessResponse(res, {
                    requestedData: {
                        userData: insertedValues,
                        languages: languages
                    },
                    message: 'Login successfully!'
                }, 200);
            } else {
                return this.sendErrorResponse(res, 201, { message: 'Please try again' });
            }

        } catch (error: any) {
            console.log('akmal', error.message);
            if (error.message === 'Invalid user name.') {
                return this.sendErrorResponse(res, 401, { message: 'Authentication failed. User not found.' });
            } else if (error.message === 'Invalid password.') {
                return this.sendErrorResponse(res, 401, { message: 'Authentication failed. Invalid password.' });
            } else if (error.message === 'User permission declined') {
                return this.sendErrorResponse(res, 401, { message: 'User permission declined' });
            } else {
                // console.error("Error during login:", error);
                return this.sendErrorResponse(res, 500, { message: 'Internal Server Error' });
            }
        }
    }
}

export default new AuthController();
