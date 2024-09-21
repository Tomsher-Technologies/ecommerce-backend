import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, getCountryId, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';
import { offerStatusSchema, offersSchema } from '../../../utils/schemas/admin/marketing/offers-schema';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import OfferService from '../../../services/admin/marketing/offer-service'
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

const controller = new BaseController();

class OffersController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
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
                        { offerTitle: keywordRegex },
                        { linkType: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const offers = await OfferService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: offers,
                totalCount: await OfferService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching offers' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = offersSchema.safeParse(req.body);

            if (validatedData.success) {
                const { countryId, offerTitle, slug, offerDescription, offerIN, offersBy, offerApplyValues, offerType, buyQuantity, getQuantity, offerDateRange, status } = validatedData.data;
                const user = res.locals.user;

                const offerData = {
                    countryId: countryId || getCountryId(user),
                    offerTitle,
                    slug: slug || slugify(offerTitle),
                    offerImageUrl: handleFileUpload(req, null, req.file, 'offerImageUrl', 'offer'),
                    offerDescription,
                    offersBy,
                    offerIN,
                    offerApplyValues: Array.isArray(offerApplyValues) ? offerApplyValues : stringToArray(offerApplyValues),
                    offerType,
                    buyQuantity,
                    getQuantity,
                    offerDateRange: Array.isArray(offerDateRange) ? offerDateRange : stringToArray(offerDateRange),
                    status: status || '1', createdBy: user._id, createdAt: new Date()
                };

                const newOffer: any = await OfferService.create(offerData);
                if (newOffer) {
                   
                    return controller.sendSuccessResponse(res, {
                        requestedData: newOffer?.length > 0 ? newOffer[0] : newOffer,
                        message: 'Offer created successfully!'
                    }, 200, { // task log
                        sourceFromId: newOffer._id,
                        sourceFrom: adminTaskLog.marketing.offers,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'something went wrong!'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.offerTitle) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        offerTitle: "Offer name already exists"
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating offer',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const offerId = req.params.id;
            if (offerId) {
                const offer = await OfferService.findOne(offerId);
                await OfferService.setOfferApplicableProducts(offer)
                return controller.sendSuccessResponse(res, {
                    requestedData: offer,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Offer Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = offersSchema.safeParse(req.body);
            if (validatedData.success) {
                const offerId = req.params.id;
                if (offerId) {
                    let updatedofferData = req.body;
                    updatedofferData = {
                        ...updatedofferData,
                        offerApplyValues: Array.isArray(updatedofferData.offerApplyValues) ? updatedofferData.offerApplyValues : stringToArray(updatedofferData.offerApplyValues),
                        offerDateRange: Array.isArray(updatedofferData.offerDateRange) ? updatedofferData.offerDateRange : stringToArray(updatedofferData.offerDateRange),
                        offerImageUrl: handleFileUpload(req, await OfferService.findOne(offerId), req.file, 'offerImageUrl', 'offer'),
                        updatedAt: new Date()
                    };

                    const updatedOffer: any = await OfferService.update(offerId, updatedofferData);
                    if (updatedOffer) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedOffer?.length > 0 ? updatedOffer[0] : updatedOffer,
                            message: 'Offer updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedOffer._id,
                            sourceFrom: adminTaskLog.marketing.offers,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Offer Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Offer Id not found! Please try again with offer id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating offer'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = offerStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const offerId = req.params.id;
                if (offerId) {
                    let { status } = req.body;
                    const updatedOfferData = { status };

                    const updatedOffer: any = await OfferService.update(offerId, updatedOfferData);
                    if (updatedOffer) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedOffer?.length > 0 ? updatedOffer[0] : updatedOffer,
                            message: 'Offers status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedOffer._id,
                            sourceFrom: adminTaskLog.marketing.offers,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Offer Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Offer Id not found! Please try again with offer id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating offer'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const offerId = req.params.id;
            if (offerId) {
                const offer = await OfferService.findOne(offerId);
                if (offer) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this offer',
                    });
                    // await OfferService.destroy(offerId);
                    // return controller.sendSuccessResponse(res, { message: 'Offer deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This offer details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Offer id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting offer' });
        }
    }

}

export default new OffersController();