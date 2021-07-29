jQuery.sap.setObject("dep.fiori.lib.util.UserStatus", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(UserStatus, Utilities) {
    var _oDialog = null;
    var _oPendingSelection = null;

    // Assign all these functions to the main object without overwriting
    Object.assign(UserStatus, {
        getDialog: function() {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.userstatus", this);

                var mUserStatus = new sap.ui.model.json.JSONModel("/ws_restful_data_controller/workorder_userstatuses");
                _oDialog.setModel(mUserStatus);

                var mUserStatus = new sap.ui.model.json.JSONModel("/ws_restful_data_controller/workorder_userstatuses?DATAKEY=DTUserStatusWithoutNum");
                _oDialog.setModel(mUserStatus, "unnumbered");

                _oDialog.setModel(new sap.ui.model.json.JSONModel(), "workorder");
                _oDialog.setModel(new sap.ui.model.json.JSONModel(), "selected");
                _oDialog.setModel(new sap.ui.model.json.JSONModel(), "selected-unnumbered");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
            }

            return _oDialog;
        },

        getUserStatus: function(sCurrentStatus, sCanComplete) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = UserStatus.getDialog();
            oDialog.getModel("workorder").setData({ status: sCurrentStatus, canComplete: sCanComplete });
            oDialog.getModel("selected").setData(sCurrentStatus);
            oDialog.getModel("selected-unnumbered").setData(null);
            if (!oDialog.isOpen()) {
                oDialog.open();
            }

            return _oPendingSelection;
        },

        onSave: function(oEvent) {
            var oDialog = UserStatus.getDialog();
            var sCurrent = oDialog.getModel("workorder").getProperty("/status");
            var sStatus = oDialog.getModel("selected").getData();
            var sUnnumbered = oDialog.getModel("selected-unnumbered").getData();

            var sSelected;
            if (sStatus !== sCurrent.substring(0, 4)) {
                sSelected = sStatus;
            }

            var sNewStatus = sStatus + sCurrent.substring(4);
            if (sUnnumbered) {
                sNewStatus += ' ' + sUnnumbered;
                if (sSelected) {
                    sSelected += ' ' + sUnnumbered;
                } else {
                    sSelected = sUnnumbered;
                }
            }

            if (_oPendingSelection) {
                _oPendingSelection.resolve(sNewStatus, sSelected);
            }

            UserStatus.close();
        },

        close: function() {
            var oDialog = UserStatus.getDialog();
            oDialog.close();
        },

        onCancel: function() {
            if (_oPendingSelection) {
                _oPendingSelection.reject();
            }
        },

        onSelectUnnumbered: function(oEvent) {
            var bSelected = oEvent.getParameter("selected");
            var oModel = UserStatus.getDialog().getModel("selected-unnumbered");
            if (bSelected) {
                var oContext = oEvent.getSource().getBindingContext("unnumbered")
                sStatus = oContext.getModel().getProperty(oContext.getPath() + "/DO_KEY");
                oModel.setData(sStatus);
            } else {
                oModel.setData(null);
            }
        },

        validUnnumberedStatus: function(sStatus, sSelected, sCurrent, sPrevious) {
            if (sPrevious.indexOf(sStatus) > -1) {
                return false;
            }

            var valid = false;
            switch (sStatus) {
                case "CANX":
                    if (sCurrent.indexOf("INPL") > -1 ||
                        sCurrent.indexOf("WFRV") > -1) {
                        valid = true;
                    }
                    break;
                default:
                    if (sCurrent.indexOf("TECO") === -1) {
                        valid = true;
                    }
            }

            // Check if something else is already selected
            if (sStatus === sSelected || !sSelected || typeof(sSelected) !== 'string') {
                return (valid && true);
            }
            return false;
        },

        validUserStatusFormatter: function(sStatus, sCurrentStatus, sCanComplete) {
            switch (sCurrentStatus.substring(0, 4)) {
                case "INPL":
                    if (sStatus === "INPL" ||
                        sStatus === "WFRV") {
                        return true;
                    }
                    break;
                case "WFRV":
                    if (sStatus === "WFRV" ||
                        sStatus === "REDY") {
                        return true;
                    }
                    break;
                case "REDY":
                    if (sStatus === "REDY" ||
                        (sStatus === "CMPL" && sCanComplete === "0")) {
                        return true;
                    }
                    break;
                case "CMPL":
                    if (sStatus === "CMPL" ||
                        sStatus === "TECO") {
                        return true;
                    }
                    break;
                case "TECO":
                    if (sStatus === "TECO") {
                        return true;
                    }
                    break;
                default:
                    return true;
            }
            return false;
        }
    });
}(dep.fiori.lib.util.UserStatus, dep.fiori.lib.util.Utilities));