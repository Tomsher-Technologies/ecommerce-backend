export const findOrderStatusDateCheck = (orderStatus: any) => {
    let statusAt
    switch (orderStatus) {
        case '1':
            statusAt = 'orderStatusAt';
            break;
        case '2':
            statusAt = 'processingStatusAt';
            break;
        case '3':
            statusAt = 'packedStatusAt';
            break;
        case '4':
            statusAt = 'shippedStatusAt';
            break;
        case '5':
            statusAt = 'deliveredStatusAt';
            break;
        case '6':
            statusAt = 'canceledStatusAt';
            break;
        case '7':
            statusAt = 'returnedStatusAt';
            break;
        case '8':
            statusAt = 'refundedStatusAt';
            break;
        case '9':
            statusAt = 'partiallyShippedStatusAt';
            break;
        case '10':
            statusAt = 'onHoldStatusAt';
            break;
        case '11':
            statusAt = 'failedStatusAt';
            break;
        case '12':
            statusAt = 'completedStatusAt';
            break;
        case '13':
            statusAt = 'pickupStatusAt';
            break;
        case '14':
            statusAt = 'partiallyDeliveredStatusAt';
            break;
        case '15':
            statusAt = 'partiallyCanceledStatusAt';
            break;
        case '16':
            statusAt = 'partiallyReturnedStatusAt';
            break;
        case '17':
            statusAt = 'partiallyRefundedStatusAt';
            break;

        default:
            statusAt = '';
            break;
    }
    return statusAt

}

