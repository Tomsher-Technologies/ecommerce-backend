import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../constants/collections';

export interface SearchQueryProps extends Document {
    customerId: Schema.Types.ObjectId;
    guestUserId?: string;
    searchQuery?: string;
    searchCount?: Number;
    createdAt?: Date;
    lastSearchedAt?: Date;
}

const searchQuerySchema: Schema<SearchQueryProps> = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.customer.customers}`,
        default: null
    },
    guestUserId: {
        type: String,
        default: null
    },
    searchQuery: {
        type: String,
        required: true
    },
    searchCount: {
        type: Number,
        required: true
    },
    lastSearchedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


const SearchQueriesModel = mongoose.model<SearchQueryProps>(collections.searchQueries, searchQuerySchema);
export default SearchQueriesModel;
