import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

import { QueryParams } from "../../../utils/types/common";
import { formatZodError, getCountryId, handleFileUpload } from '../../../utils/helpers';
import { websiteSetup } from '../../../constants/website-setup';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { navigationMenutSchema } from '../../../utils/schemas/admin/website/navigation-menu-shema';
import { multiLanguageSources } from '../../../constants/multi-languages';

import BaseController from "../base-controller";
import NavigationMenuService from "../../../services/admin/website/navigation-menu-service";
import GeneralService from '../../../services/admin/general-service';


const controller = new BaseController();

class NavigationMenuController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const countryId = getCountryId(userData);
            if (countryId) {
                query.countryId = countryId;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
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
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const navigationMenus = await NavigationMenuService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: navigationMenus,
                totalCount: await NavigationMenuService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching navigationMenus' });
        }
    }

    async manageWithCountryId(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = navigationMenutSchema.safeParse(req.body);

            const userData = await res.locals.user;
            const countryId = req.params.id || req.body.countryId || getCountryId(userData);
            if (validatedData.success) {
                if (countryId) {
                    const { languageId, websiteSetupId, status, blockValues, deviceType } = validatedData.data;
                    const user = res.locals.user;
                    // const multiFiles: any = req.files

                    const menuData = {
                        countryId,
                        block: websiteSetup.menu,
                        blockReference: deviceType,
                        blockValues,
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }

                    let newNavigationMenu: any = [];
                    if (!languageId) {
                        if (!websiteSetupId) {
                            newNavigationMenu = await NavigationMenuService.create(menuData);
                        } else {
                            const navigationMenu = await NavigationMenuService.findOne({ _id: websiteSetupId, countryId: countryId, block: websiteSetup.menu, blockReference: deviceType });
                            if (navigationMenu) {
                                newNavigationMenu = await NavigationMenuService.update(navigationMenu._id, menuData);
                            } else {
                                if (blockValues && (blockValues?.length > 0)) {
                                    newNavigationMenu = await NavigationMenuService.create(menuData);
                                } else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Menu  items not found',
                                    }, req);
                                }
                            }
                        }
                    } else {
                        if (websiteSetupId) {
                            const languageValues = await GeneralService.multiLanguageFieledsManage(websiteSetupId, {
                                languageId,
                                source: multiLanguageSources.setup.websiteSetups,
                                sourceId: websiteSetupId,
                                languageValues: menuData
                            });
                            if (languageValues) {
                                newNavigationMenu = languageValues?.languageValues
                            } else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Something went wrong on when language menu insertion. Please try again!',
                                }, req);
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Please create atleast one main language menu',
                            }, req);
                        }
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newNavigationMenu,
                        message: 'Navigation menu created successfully!'
                    }, 200, { // task log
                        sourceFromId: newNavigationMenu._id,
                        sourceFrom: adminTaskLog.website.navigationMenu,
                        activity: websiteSetupId ? adminTaskLogActivity.update : adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Country id not found',
                    }, req);
                }
            } else {

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
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

    async findOneWithCountryId(req: Request, res: Response): Promise<void> {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const languageId: any = req.query.languageId;

                const navigationMenu: any = await NavigationMenuService.findOne({ countryId: countryId, block: websiteSetup.menu, blockReference: req.query.deviceType });

                if (languageId && navigationMenu) {
                    const languageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.setup.websiteSetups, navigationMenu._id, languageId)
                    if (languageValues) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: languageValues.languageValues,
                            message: 'Success'
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Not found on this language menu item. Please try to add new menu item!',
                        });
                    }
                } else {
                    return controller.sendSuccessResponse(res, {
                        requestedData: navigationMenu,
                        message: 'Success'
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country id with navigation menu not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}

export default new NavigationMenuController();