jQuery.sap.setObject("dep.fiori.assignment.app.Constants", {});

(function(Constants) {
    Object.assign(Constants, {
        AssignmentType: {
            WORKORDER: "WO",
            OPERATION: "OP",
            PHYS_INV_DOC: "PID"
        },
        AssignmentStatus: {
            ASSIGNED: "ASN",
            ACCEPTED: "ACC",
            REJECTED: "REJ"
        },
        LockType: {
            MOBILE: "MOBILE"
        }
    });
}(dep.fiori.assignment.app.Constants));