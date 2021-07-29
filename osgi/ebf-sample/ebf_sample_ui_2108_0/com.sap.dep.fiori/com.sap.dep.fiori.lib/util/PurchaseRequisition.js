jQuery.sap.declare("dep.fiori.lib.util.PurchaseRequisition");

dep.fiori.lib.util.PurchaseRequisition = {
    getIconNameFromStatus: function(sStatus) {
        if (sStatus === "PENDING") {
            return "status-in-process";
        } else if (sStatus === "REJECTED") {
            return "status-error";
        } else if (sStatus === "APPROVED") {
            return "status-completed";
        } else if (sStatus === "WFAPPROVAL") {
            return "status-in-process";
        }
        return "";
    },

    recordMarkUpGenerator: function(sStatus, aPrNum){
        if (aPrNum.length === 0) {
            return "";
        }
        var desc = "";
        var iconName = this.getIconNameFromStatus(sStatus);
        if (iconName) {
            var icon = sap.ui.core.IconPool.getIconInfo(this.getIconNameFromStatus(sStatus));
            desc = '<div style="float: left;">' +
                '<span style="font-family:\'SAP-icons\'; font-size: x-large; vertical-align: top; padding-top: 0.5rem;" class="sapUiIcon icon-' +
                    iconName + '">' + icon.content + "</span>" +
                '<div style="display: inline-block;"><p>' + sStatus + "</p>";
        }

        for (var x = 0; x < aPrNum.length; x++) {
            desc += "<p>" + aPrNum[x] + "</p>";
        }
        desc += "</div></div>";
        return desc;
    },

    checkIfABackendError: function(matnr){
        var aBackEndErrors = this.mBackEndErrors.getData();
        for (var x = 0; x < aBackEndErrors.length; x++) {
            if (aBackEndErrors[x].MATNR === matnr &&
                aBackEndErrors[x].TYPE === "Error") {
                return true;
            }
        }
        return false;
    },

    visibilityFormatter: function(sMaterial, aSelected) {
        for (var x = 0; x < aSelected.length; x++) {
            if (aSelected[x].MATNR === sMaterial) {
                return true;
            }
        }
        return false;
    },

    getFormattedCurDate: function(d) {
        if (isNaN(d.getDate())) {
            return "unknown";
        }
        var mNames = [ "Jan", "Feb", "Mar",
            "Apr", "May", "Jun", "Jul", "Aug", "Sep",
            "Oct", "Nov", "Dec" ];

        var currDate = d.getUTCDate();
        var currMonth = d.getMonth();
        var currYear = d.getFullYear();
        return mNames[currMonth] + " " + currDate + ", " + currYear;
    }
};