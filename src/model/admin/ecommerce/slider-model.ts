import mongoose, { Schema, Document } from 'mongoose';

export interface SliderProps extends Document {
    countryId: Schema.Types.ObjectId;
    sliderTitle: string;
    slug: string;
    page: string;
    pageReference: string;
    linkType: string; // product, category, brand, custom
    link: string;
    description: string;
    sliderImageUrl: string;
    position: number;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const sliderSchema: Schema<SliderProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    sliderTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Sliders').countDocuments({ sliderTitle: value });
                return count === 0;
            },
            message: 'Slider title must be unique'
        },
        minlength: [2, 'Slider title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },

    description: {
        type: String,
        default: '',
    },
    sliderImageUrl: {
        type: String,
        required: true,
    },
    page: {
        type: String,
        required: true,
    },
    pageReference: {
        type: String,
        required: true,
    }, linkType: {
        type: String,
        required: true,
        validate: {
            validator: function (value: string) {
                return ['product', 'category', 'brands', 'custom'].includes(value);
            },
            message: 'Invalid linkType value. Must be one of: product, category, brand, custom'
        }
    },
    link: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

sliderSchema.pre<SliderProps>('save', async function (next) {
    try {
        const count = await this.model('Sliders').countDocuments();

        this.position = count + 1;
        next();
    } catch (error: any) {
        next(error);
    }
});

const SliderModel = mongoose.model<SliderProps>('Sliders', sliderSchema);
export default SliderModel;
