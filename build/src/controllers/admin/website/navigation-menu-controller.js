"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const website_setup_1 = require("../../../constants/website-setup");
const task_log_1 = require("../../../constants/admin/task-log");
const navigation_menu_shema_1 = require("../../../utils/schemas/admin/website/navigation-menu-shema");
const multi_languages_1 = require("../../../constants/multi-languages");
const base_controller_1 = __importDefault(require("../base-controller"));
const navigation_menu_service_1 = __importDefault(require("../../../services/admin/website/navigation-menu-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const controller = new base_controller_1.default();
class NavigationMenuController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', countryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { collectionTitle: keywordRegex },
                        { linkType: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const navigationMenus = await navigation_menu_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: navigationMenus,
                totalCount: await navigation_menu_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching navigationMenus' });
        }
    }
    async manageWithCountryId(req, res) {
        try {
            const validatedData = navigation_menu_shema_1.navigationMenutSchema.safeParse(req.body);
            const userData = await res.locals.user;
            const countryId = req.params.id || req.body.countryId || (0, helpers_1.getCountryId)(userData);
            if (validatedData.success) {
                if (countryId) {
                    const { languageId, websiteSetupId, status, blockValues, deviceType } = validatedData.data;
                    const user = res.locals.user;
                    const menuData = {
                        countryId,
                        block: website_setup_1.websiteSetup.menu,
                        blockReference: deviceType,
                        blockValues,
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    let newNavigationMenu = [];
                    if (!languageId) {
                        const navigationMenu = await navigation_menu_service_1.default.findOne({ countryId: countryId, block: website_setup_1.websiteSetup.menu, blockReference: deviceType });
                        if (navigationMenu) {
                            newNavigationMenu = await navigation_menu_service_1.default.update(navigationMenu._id, menuData);
                        }
                        else {
                            if (!websiteSetupId) {
                                newNavigationMenu = await navigation_menu_service_1.default.create(menuData);
                            }
                            else {
                                if (blockValues && (blockValues?.length > 0)) {
                                    newNavigationMenu = await navigation_menu_service_1.default.create(menuData);
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Menu  items not found',
                                    }, req);
                                }
                            }
                        }
                        // if (!websiteSetupId) {
                        //     newNavigationMenu = await NavigationMenuService.create(menuData);
                        // } else {
                        //     const navigationMenu = await NavigationMenuService.findOne({ _id: websiteSetupId, countryId: countryId, block: websiteSetup.menu, blockReference: deviceType });
                        //     if (navigationMenu) {
                        //         newNavigationMenu = await NavigationMenuService.update(navigationMenu._id, menuData);
                        //     } else {
                        //         if (blockValues && (blockValues?.length > 0)) {
                        //             newNavigationMenu = await NavigationMenuService.create(menuData);
                        //         } else {
                        //             return controller.sendErrorResponse(res, 200, {
                        //                 message: 'Menu  items not found',
                        //             }, req);
                        //         }
                        //     }
                        // }
                    }
                    else {
                        const navigationMenu = await navigation_menu_service_1.default.findOne({ countryId: countryId, block: website_setup_1.websiteSetup.menu, blockReference: deviceType });
                        if (navigationMenu) {
                            const languageValues = await general_service_1.default.multiLanguageFieledsManage(navigationMenu._id, {
                                languageId,
                                source: multi_languages_1.multiLanguageSources.setup.websiteSetups,
                                sourceId: navigationMenu._id,
                                languageValues: menuData
                            });
                            if (languageValues) {
                                newNavigationMenu = languageValues?.languageValues;
                            }
                            else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Something went wrong on when language menu insertion. Please try again!',
                                }, req);
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Please create atleast one main language menu',
                            }, req);
                        }
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newNavigationMenu,
                        message: 'Navigation menu created successfully!'
                    }, 200, {
                        sourceFromId: newNavigationMenu._id,
                        sourceFrom: task_log_1.adminTaskLog.website.navigationMenu,
                        activity: websiteSetupId ? task_log_1.adminTaskLogActivity.update : task_log_1.adminTaskLogActivity.create,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Country id not found',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            if (error && error.errors && (error.errors?.menuTitle) && (error.errors?.menuTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        menuTitle: error.errors?.menuTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating navigation menu',
            }, req);
        }
    }
    async findOneWithCountryId(req, res) {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const languageId = req.query.languageId;
                const navigationMenu = await navigation_menu_service_1.default.findOne({ countryId: countryId, block: website_setup_1.websiteSetup.menu, blockReference: req.query.deviceType });
                if (languageId && navigationMenu) {
                    const languageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.setup.websiteSetups, navigationMenu._id, languageId);
                    if (languageValues) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...languageValues.languageValues,
                                _id: navigationMenu._id
                            },
                            message: 'Success'
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Not found on this language menu item. Please try to add new menu item!',
                        });
                    }
                }
                else {
                    return controller.sendSuccessResponse(res, {
                        requestedData: navigationMenu,
                        message: 'Success'
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country id with navigation menu not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new NavigationMenuController();
