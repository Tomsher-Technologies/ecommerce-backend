"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const offers_schema_1 = require("../../../utils/schemas/admin/marketing/offers-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const offer_service_1 = __importDefault(require("../../../services/admin/marketing/offer-service"));
const task_log_1 = require("../../../constants/admin/task-log");
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class OffersController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
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
                        { offerTitle: keywordRegex },
                        { linkType: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const offers = await offer_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: offers,
                totalCount: await offer_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching offers' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = offers_schema_1.offersSchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, offerTitle, slug, offerDescription, offerIN, offersBy, offerApplyValues, offerType, buyQuantity, getQuantity, offerDateRange, status } = validatedData.data;
                const user = res.locals.user;
                const offerData = {
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    offerTitle,
                    slug: slug || (0, helpers_1.slugify)(offerTitle),
                    offerImageUrl: (0, helpers_1.handleFileUpload)(req, null, req.file, 'offerImageUrl', 'offer'),
                    offerDescription,
                    offersBy,
                    offerIN,
                    offerApplyValues: Array.isArray(offerApplyValues) ? offerApplyValues : (0, helpers_1.stringToArray)(offerApplyValues),
                    offerType,
                    buyQuantity,
                    getQuantity,
                    offerDateRange: Array.isArray(offerDateRange) ? offerDateRange : (0, helpers_1.stringToArray)(offerDateRange),
                    status: status || '1', createdBy: user._id, createdAt: new Date()
                };
                const newOffer = await offer_service_1.default.create(offerData);
                if (newOffer) {
                    await offer_service_1.default.setOfferApplicableProducts(newOffer);
                    return controller.sendSuccessResponse(res, {
                        requestedData: newOffer?.length > 0 ? newOffer[0] : newOffer,
                        message: 'Offer created successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.marketing.offers,
                        referenceData: JSON.stringify({
                            offerTitle: newOffer.offerTitle,
                            offersBy: newOffer.offersBy,
                            offerType: newOffer.offerType,
                            offerIN: newOffer.offerIN,
                            startAt: newOffer.offerDateRange[0],
                            endAt: newOffer.offerDateRange[0],
                            allValues: newOffer
                        }, null, 2),
                        sourceFromId: newOffer._id,
                        sourceFrom: task_log_1.adminTaskLog.marketing.offers,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityComment: 'Offer created successfully!',
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'something went wrong!'
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
    async findOne(req, res) {
        try {
            const offerId = req.params.id;
            if (offerId) {
                const offer = await offer_service_1.default.findOne(offerId);
                return controller.sendSuccessResponse(res, {
                    requestedData: offer,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Offer Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = offers_schema_1.offersSchema.safeParse(req.body);
            if (validatedData.success) {
                const offerId = req.params.id;
                if (offerId) {
                    const user = res.locals.user;
                    let updatedofferData = req.body;
                    updatedofferData = {
                        ...updatedofferData,
                        offerApplyValues: Array.isArray(updatedofferData.offerApplyValues) ? updatedofferData.offerApplyValues : (0, helpers_1.stringToArray)(updatedofferData.offerApplyValues),
                        offerDateRange: Array.isArray(updatedofferData.offerDateRange) ? updatedofferData.offerDateRange : (0, helpers_1.stringToArray)(updatedofferData.offerDateRange),
                        offerImageUrl: (0, helpers_1.handleFileUpload)(req, await offer_service_1.default.findOne(offerId), req.file, 'offerImageUrl', 'offer'),
                        updatedAt: new Date()
                    };
                    const updatedOffer = await offer_service_1.default.update(offerId, updatedofferData);
                    if (updatedOffer) {
                        await offer_service_1.default.setOfferApplicableProducts(updatedOffer);
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedOffer,
                            message: 'Offer updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.marketing.offers,
                            referenceData: JSON.stringify({
                                offerTitle: updatedOffer.offerTitle,
                                offersBy: updatedOffer.offersBy,
                                offerType: updatedOffer.offerType,
                                offerIN: updatedOffer.offerIN,
                                startAt: updatedOffer.offerDateRange[0],
                                endAt: updatedOffer.offerDateRange[0],
                                allValues: updatedOffer
                            }, null, 2),
                            sourceFromId: updatedOffer._id,
                            sourceFrom: task_log_1.adminTaskLog.marketing.offers,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'Offer updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Offer Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Offer Id not found! Please try again with offer id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating offer'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = offers_schema_1.offerStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const offerId = req.params.id;
                if (offerId) {
                    let { status } = req.body;
                    const updatedOfferData = { status };
                    const user = res.locals.user;
                    const updatedOffer = await offer_service_1.default.update(offerId, updatedOfferData);
                    if (updatedOffer) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedOffer?.length > 0 ? updatedOffer[0] : updatedOffer,
                            message: 'Offers status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.marketing.offers,
                            referenceData: JSON.stringify({
                                offerTitle: updatedOffer.offerTitle,
                                offersBy: updatedOffer.offersBy,
                                offerType: updatedOffer.offerType,
                                offerIN: updatedOffer.offerIN,
                                startAt: updatedOffer.offerDateRange[0],
                                endAt: updatedOffer.offerDateRange[0],
                                allValues: updatedOffer
                            }, null, 2),
                            sourceFromId: updatedOffer._id,
                            sourceFrom: task_log_1.adminTaskLog.marketing.offers,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityComment: 'Offers status updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Offer Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Offer Id not found! Please try again with offer id',
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
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating offer'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const offerId = req.params.id;
            if (offerId) {
                const offer = await offer_service_1.default.findOne(offerId);
                if (offer) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this offer',
                    });
                    // await OfferService.destroy(offerId);
                    // return controller.sendSuccessResponse(res, { message: 'Offer deleted successfully!' });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This offer details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Offer id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting offer' });
        }
    }
}
exports.default = new OffersController();
