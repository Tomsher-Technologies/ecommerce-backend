import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import ProductSpecificationModel, { ProductSpecificationProps } from '../../../../model/admin/ecommerce/product/product-specification-model';

class ProductSpecificationService {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                sku: 1,
                countryId: 1,
                price: 1,
                quantity: 1,
                discountPrice: 1,
                isDefualt: 1,
                hsn: 1,
                mpn: 1,
                barcode: 1,
                variantDescription: 1,
                cartMinQuantity: 1,
                cartMaxQuantity: 1,
                status: 1,
                createdAt: 1,
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<ProductSpecificationProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },

            this.project
        ];

        return ProductSpecificationModel.aggregate(pipeline).exec();
    }
    async find(productId: string): Promise<ProductSpecificationProps[]> {

        return ProductSpecificationModel.find({ productId: productId })
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductSpecificationModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of productSpecification');
        }
    }

    async create(productSpecification: any): Promise<ProductSpecificationProps | null> {
        try {

            if (productSpecification) {
                const existingEntries = await ProductSpecificationModel.findOne({
                    productId: productSpecification.productId,
                    variantId: productSpecification.variantId,
                    specificationId: productSpecification.specificationId,
                    specificationDetailId: productSpecification.specificationDetailId,

                });

                let attributeValue: any = {};
                if (existingEntries) {

                    const filter = {
                        productId: productSpecification.productId,
                        variantId: productSpecification.variantId,
                        specificationId: productSpecification.specificationId,
                        specificationDetailId: productSpecification.specificationDetailId,


                    };
                    const update = {
                        $set: {
                            productId: productSpecification.productId,
                            variantId: productSpecification.variantId,
                            specificationId: productSpecification.specificationId,
                            specificationDetailId: productSpecification.specificationDetailId,
                            createdAt: new Date()
                        }
                    };

                    const options = {
                        upsert: false,
                        new: true
                    };

                    attributeValue = await ProductSpecificationModel.findOneAndUpdate(filter, update, options);
                    return attributeValue

                } else {

                    const isEmptyValue = Object.values(productSpecification).some(value => (value !== ''));

                    if (isEmptyValue) {

                        const productSpecificationData = {

                            productId: productSpecification.productId,
                            variantId: productSpecification.variantId,
                            specificationId: productSpecification.specificationId,
                            specificationDetailId: productSpecification.specificationDetailId,
                            createdAt: new Date()
                        };

                        attributeValue = await ProductSpecificationModel.create(productSpecificationData);

                    }
                    return { ...attributeValue }


                }
            } else {
                console.log("null:::");

                return null
            }
        } catch {
            return null
        }
    }


    async findOne(productSpecificationId: string): Promise<ProductSpecificationProps | null> {
        if (productSpecificationId) {
            const pipeline = [
                { $match: { _id: productSpecificationId } },
                this.lookup,
                this.project
            ];

            const productSpecificationDataWithValues = await ProductSpecificationModel.aggregate(pipeline);

            return productSpecificationDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(productSpecificationId: string, productSpecificationData: any): Promise<ProductSpecificationProps | null> {
        const updatedproductSpecification = await ProductSpecificationModel.findByIdAndUpdate(
            productSpecificationId,
            productSpecificationData,
            { new: true, useFindAndModify: false }
        );

        if (updatedproductSpecification) {
            const pipeline = [
                { $match: { _id: updatedproductSpecification._id } },
                this.lookup,
                this.project
            ];

            const updatedproductSpecificationWithValues = await ProductSpecificationModel.aggregate(pipeline);

            return updatedproductSpecificationWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(productSpecificationId: string): Promise<ProductSpecificationProps | null> {
        return ProductSpecificationModel.findOneAndDelete({ _id: productSpecificationId });
    }

    async productSpecificationService(productId: string | null, specificationDetails: any): Promise<ProductSpecificationProps[]> {
        try {
            if (productId) {
                const existingEntries = await ProductSpecificationModel.find({ productId: productId });
                if (existingEntries) {
                    const specificationIDsToRemove = existingEntries
                        .filter(entry => !specificationDetails?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);

                    await ProductSpecificationModel.deleteMany({ productId: productId, _id: { $in: specificationIDsToRemove } });
                }
                if (specificationDetails) {
                    const productSpecificationPromises = await Promise.all(specificationDetails.map(async (data: any) => {
                        const existingEntry = await ProductSpecificationModel.findOne({ _id: data._id });
                        if (existingEntry) {
                            // Update existing document
                            await ProductSpecificationModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });

                        } else {
                            // Create new document
                            await ProductSpecificationModel.create({ ...data, productId: productId });
                        }
                    }));

                    await Promise.all(productSpecificationPromises);
                }
                return await ProductSpecificationModel.find({ productId: productId });
            } else {
                throw 'Could not find product specification Id';
            }

        } catch (error) {
            console.error('Error in Product specification service:', error);
            throw error;
        }
    }
}

export default new ProductSpecificationService();