import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';

import { deleteFile, formatZodError, handleFileUpload, slugify, uploadGallaryImages } from '@utils/helpers';
import { productsSchema, updateWebsitePrioritySchema } from '@utils/schemas/admin/ecommerce/products-schema';
import { ProductsProps, ProductsQueryParams } from '@utils/types/products';

import BaseController from '@controllers/admin/base-controller';
import ProductsService from '@services/admin/ecommerce/products-service'
import ProductsModel from '@model/admin/ecommerce/products-model';
import collectionsProductsService from '@services/admin/website/collections-products-service';

const controller = new BaseController();

class ProductsController extends BaseController {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '', productId, category, unCollectionedProducts } = req.query as ProductsQueryParams;

            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { en_productTitle: keywordRegex },
                        { ar_productTitle: keywordRegex },
                        { productTitle: keywordRegex },
                        { categoryTitle: keywordRegex },
                        { brandTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            if (productId) {
                query = {
                    ...query, _id: productId
                } as any;
            }
            
            if (category) {
                query = {
                    ...query, category: category
                } as any;
            }


            const keysToCheck: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<ProductsQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }
            if (unCollectionedProducts) {
                const collection = await collectionsProductsService.findOne(unCollectionedProducts);
                if (collection) {
                    // const unCollectionedProductIds = unCollectionedProducts ? unCollectionedProducts.split(',').map((id: string) => id.trim()) : [];
                    if (collection.collectionsProducts.length > 0) {
                        query._id = { $nin: collection.collectionsProducts };
                        query.status = '1';
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const products = await ProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: products,
                totalCount: await ProductsService.getTotalCount(query),
                message: 'Success'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = productsSchema.safeParse(req.body);


            if (validatedData.success) {
                const { en_productTitle, ar_productTitle, slug, category, brand, unit, tags, inventryDetails, sku, description, longDescription, cartMinQuantity, cartMaxQuantity,
                    pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription } = validatedData.data;
                const user = res.locals.user;

                const productImage = (req as any).files.find((file: any) => file.fieldname === 'productImage');
                const galleryImages = (req as any).files.filter((file: any) => file.fieldname === 'galleryImage[]');

                const productData: Partial<ProductsProps> = {
                    en_productTitle,
                    ar_productTitle,
                    slug: slug || slugify(en_productTitle) as any,
                    category: category as any,
                    brand: brand as any,
                    description,
                    longDescription,
                    productImageUrl: handleFileUpload(req, null, (req.file || productImage), 'productImageUrl', 'product'),
                    inventryDetails,
                    unit: unit as string,
                    tags: tags as string,
                    cartMinQuantity,
                    cartMaxQuantity,
                    sku,
                    pageTitle: pageTitle as string,
                    metaTitle: metaTitle as string,
                    metaKeywords: metaKeywords as string,
                    metaDescription: metaDescription as string,
                    metaImageUrl: metaImage as string,
                    ogTitle: ogTitle as string,
                    ogDescription: ogDescription as string,
                    twitterTitle: twitterTitle as string,
                    twitterDescription: twitterDescription as string,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newProduct = await ProductsService.create(productData);
                // const fetchedProduct = await ProductsService.findOne(newProduct._id);
                if (newProduct) {
                    if (galleryImages?.length > 0) {
                        uploadGallaryImages(req, newProduct._id, galleryImages);
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newProduct,
                        message: 'Product created successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Product can't inserting. please try again!"
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.en_productTitle && error.errors.en_productTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        en_productTitle: error.errors.en_productTitle.properties.message
                    }
                }, req);
            }
            if (error && error.errors && error.errors.ar_productTitle && error.errors.ar_productTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        ar_productTitle: error.errors.ar_productTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            if (productId) {

                const product = await ProductsService.findOne(productId);
                if (product) {
                    const imageGallery = await ProductsService.findGalleryImagesByProductId('', productId);
                    const inventryPricingData = await ProductsService.findInventryPricingByProductId('', productId);

                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...product.toObject(),
                            inventryDetails: inventryPricingData?.map(inventryPricing => inventryPricing),
                            imageGallery: imageGallery ? imageGallery.map(image => ({
                                galleryImageID: image._id,
                                src: `${process.env.BASE_URL}${process.env.PORT}${image.galleryImageUrl}`,
                                name: product.en_productTitle,
                            })) : null
                        },
                        message: 'Success'
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            // console.log('updatedProductData', req.body);
            const validatedData = productsSchema.safeParse(req.body);

            if (validatedData.success) {
                const inventryDetailsArray = Object.values(validatedData.data?.inventryDetails ?? {});

                const productId = req.params.id;
                if (productId) {
                    let updatedProductData = req.body;

                    const productImage = (req as any).files?.find((file: any) => file.fieldname === 'productImage');
                    const galleryImages = (req as any).files?.filter((file: any) => file.fieldname === 'galleryImage[]');

                    updatedProductData = {
                        ...updatedProductData,
                        productImageUrl: handleFileUpload(req, await ProductsService.findOne(productId), (req.file || productImage), 'productImageUrl', 'product'),
                        updatedAt: new Date()
                    };

                    const updatedProduct = await ProductsService.update(productId, updatedProductData);
                    if (updatedProduct) {
                        const updatedinventryDetailsData = await ProductsService.inventryDetailsService(productId, inventryDetailsArray);

                        if (updatedProductData?.removedGalleryImages) {

                            const removedGalleryImages = updatedProductData?.removedGalleryImages.split(',');
                            if (removedGalleryImages.length > 0) {

                                let imageGallery: any[] = [];
                                await Promise.all(removedGalleryImages.map(async (image: any) => {
                                    const imageGalleries = await ProductsService.findGalleryImagesByProductId(image, productId);
                                    if (imageGalleries.length > 0) {
                                        imageGallery.push(imageGalleries[0]);
                                    }
                                }));
                                if (imageGallery.length > 0) {
                                    await Promise.all(imageGallery.map(async (image: any) => {
                                        deleteFile(path.join(__dirname, `../../../${image.galleryImageUrl}`))
                                            .then(() => {
                                                console.log('imageGallery', image.galleryImageUrl);
                                                ProductsService.destroyGalleryImages(image)
                                            })
                                            .catch((err) => {
                                                console.log('errorerrorerrorimageGallery', err);
                                            });
                                    }));
                                }
                            }
                        }
                        if (galleryImages?.length > 0) {
                            uploadGallaryImages(req, updatedProduct._id, galleryImages);
                        }
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedProduct,
                            message: 'Product updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Product Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Product Id not found! Please try again with product id',
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
                message: error.message || 'Some error occurred while updating product'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            if (productId) {
                const product = await ProductsService.findOne(productId);
                if (productId) {
                    await ProductsService.destroy(productId);
                    controller.sendSuccessResponse(res, { message: 'Product deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This product details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Product id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting product' });
        }
    }

    async updateWebsitePriority(req: Request, res: Response): Promise<void> {
        try {

            const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];

                if (validKeys.includes(keyColumn as keyof ProductsProps)) {
                    let updatedProductData = req.body;
                    updatedProductData = {
                        ...updatedProductData,
                        updatedAt: new Date()
                    };
                    await ProductsService.updateWebsitePriority(container1, keyColumn as keyof ProductsProps);

                    return controller.sendSuccessResponse(res, {
                        requestedData: await ProductsModel.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Product website priority updated successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Invalid key column provided',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }

    // async uploadGallaryImages(req: Request, productID: string, galleryImages: any[]): Promise<void> {
    //     try {
    //     console.log('heeeeeeeeeeeeeeeeeeeeeeeeeeee');

    //         await galleryImages.map((galleryImage)=> {
    //             const galleryImageData = {
    //                 productID: productID,
    //                 galleryImageUrl:  handleFileUpload(req, null, galleryImage, 'galleryImageUrl', 'product'),
    //                 status: '1'
    //             }
    //             ProductsService.createGallaryImages(galleryImageData)
    //         })
    //     } catch (error) {
    //     console.log('errorerrorerror',);

    //         // Handle errors
    //     }
    // }

}

export default new ProductsController();