jQuery.sap.setObject("dep.fiori.materialdoc.app.Constants", {});

(function(Constants) {
    Object.assign(Constants, {
        MovementType: {
            GOOD_RECEIPT_FOR_PO             : "101", // Good receipt from Purchase Order
            GOOD_RECEIPT_FOR_PO_REVERSAL    : "102", // Good receipt from Purchase Order Reversal
            RETURN_TO_VENDOR                : "122",
            GOOD_ISSUED_FOR_COST_CENTRE     : "201", // GOOD_ISSUED_FOR_AFE
            GOOD_ISSUED_FOR_COST_CENTRE_REVERSAL : "202",
            GOOD_ISSUED_FOR_WORKORDER       : "261",
            GOOD_ISSUED_FOR_WORKORDER_REVERSAL : "262",
            TRANSFER_PLANT_TO_PLANT         : "301",
            TRANSFER_IN_PLANT               : "312", // currently not used
            TRANSFER_QUALITY_TO_UNRESTRICTED : "321", // currently not used
            TRANSFER_BLOCKED_TO_UNRESTRICTED : "343",
            TRANSFER_BLOCKED_TO_UNRESTRICTED_REVERSAL : "344"
        }
    });
}(dep.fiori.materialdoc.app.Constants));