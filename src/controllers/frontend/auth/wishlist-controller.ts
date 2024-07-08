import { Request, Response } from "express";
import { QueryParams } from "../../../utils/types/common";

import BaseController from "../../admin/base-controller";
import CustomerWishlistCountryService from '../../../services/frontend/auth/customer-wishlist-servicel'
import CommonService from "../../../services/frontend/guest/common-service";
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import { addToWishlistSchema, moveTCartSchema } from "../../../utils/schemas/frontend/auth/wishlist-schema";
import { formatZodError } from "../../../utils/helpers";

const controller = new BaseController();

class WishlistsController extends BaseController {

    async findAllWishlists(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, sortby = '', sortorder = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            query.status = '1';
            query.userId = userData._id;

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const wishlists = await CustomerWishlistCountryService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                hostName: req.get('origin'),
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: wishlists,
                totalCount: await CustomerWishlistCountryService.getTotalCount(query),
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching wishlist products' });
        }

    }

    async addToWishlist(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }

            const validatedData = addToWishlistSchema.safeParse(req.body);
            if (!validatedData.success) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }

            const { slug, sku } = validatedData.data;
            const productVariantData = await ProductVariantsModel.findOne({ countryId, variantSku: sku, slug });
            if (!productVariantData) {
                return controller.sendErrorResponse(res, 500, { message: 'Product not found!' });
            }
            const user = res.locals.user;
            const wishlistData = await CustomerWishlistCountryService.findOne({ userId: user._id, countryId, slug });

            if (wishlistData) {
                const deletedData = await CustomerWishlistCountryService.destroy(wishlistData._id);
                if (!deletedData) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong on wishlist removed!' });
                }

                const query = { status: '1', userId: user._id };
                const requestedData = await CustomerWishlistCountryService.findAll({ query, hostName: req.get('origin') });
                return controller.sendSuccessResponse(res, { requestedData, message: 'Wishlist removed successfully!' });
            } else {
                const wishlistInsertData = {
                    countryId,
                    userId: user._id,
                    productId: productVariantData.productId,
                    variantId: productVariantData._id,
                    slug: productVariantData.slug,
                    variantSku: productVariantData.variantSku
                };

                const insertData = await CustomerWishlistCountryService.create(wishlistInsertData);
                if (!insertData) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong on wishlist add!' });
                }

                const query = { status: '1', userId: user._id };
                const requestedData = await CustomerWishlistCountryService.findAll({ query, hostName: req.get('origin') });
                return controller.sendSuccessResponse(res, { requestedData, message: 'Wishlist added successfully!' });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while add to wishlist' });
        }
    }


    async moveTCart(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            const validatedData = moveTCartSchema.safeParse(req.body);
            if (validatedData.success) {
                const { slug, sku } = validatedData.data;

                const productVariantData = await ProductVariantsModel.findOne({
                    countryId,
                    variantSku: sku,
                    slug
                });
                if (productVariantData) {
                    const user = res.locals.user;
                    const whishlistData = await CustomerWishlistCountryService.findOne({
                        userId: user._id,
                        countryId,
                    })

                    if (whishlistData) {
                        // do move to cart logic here

                        const deletedData = await CustomerWishlistCountryService.destroy(whishlistData._id);
                        return controller.sendSuccessResponse(res, {
                            requestedData: {},
                            message: 'Move to cart successfully completed!'
                        });
                    } else {
                        return controller.sendErrorResponse(res, 500, {
                            message: 'Wishlist product not found!'
                        });
                    }

                } else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Product not found!'
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while add to wishlist'
            });
        }

    }

}
export default new WishlistsController();