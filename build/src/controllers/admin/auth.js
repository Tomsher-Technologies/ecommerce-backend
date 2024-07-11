"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const auth_service_1 = __importDefault(require("../../services/admin/auth-service"));
const base_controller_1 = __importDefault(require("../../../src/controllers/admin/base-controller"));
const languages_service_1 = __importDefault(require("../../../src/services/admin/setup/languages-service"));
class AuthController extends base_controller_1.default {
    constructor() {
        super();
        this.login = this.login.bind(this);
    }
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const insertedValues = await auth_service_1.default.login(username, password);
            if (insertedValues) {
                const languages = await languages_service_1.default.findAll({
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
            }
            else {
                return this.sendErrorResponse(res, 201, { message: 'Please try again' });
            }
        }
        catch (error) {
            if (error.message === 'Invalid user name.') {
                return this.sendErrorResponse(res, 401, { message: 'Authentication failed. User not found.' });
            }
            else if (error.message === 'Invalid password.') {
                return this.sendErrorResponse(res, 401, { message: 'Authentication failed. Invalid password.' });
            }
            else if (error.message === 'User permission declined') {
                return this.sendErrorResponse(res, 401, { message: 'User permission declined' });
            }
            else {
                return this.sendErrorResponse(res, 500, { message: error?.message || 'Internal Server Error' });
            }
        }
    }
}
exports.default = new AuthController();
