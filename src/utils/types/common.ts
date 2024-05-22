export interface QueryParams {
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
}

export interface UserDataProps {
    _id: string;
    userTypeID: string;
    countryId: string;
    firstName: string;
    phone: string;
    status: string;
}

