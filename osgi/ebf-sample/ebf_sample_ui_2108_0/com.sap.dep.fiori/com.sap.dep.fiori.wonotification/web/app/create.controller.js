jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");

(function(Utilities, DataAccess, SelectEquipmentDialog) {
    sap.ui.controller("dep.fiori.wonotification.app.create", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");

            this.mNotification = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mNotification);
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "create") {
                var oArgs = oEvent.getParameter("arguments");

            }
        },

        onEquipmentValueHelp: function(oEvent) {
            var self = this;
            SelectEquipmentDialog.getEquipment().done(function(oEquipment) {
                Object.assign(self.mNotification.getData(), {
                    EQUNR: oEquipment.EQUNR,
                    EQKTX: oEquipment.EQKTX,
                    TPLNR: oEquipment.TPLNR,
                    TPLNR_EXT: oEquipment.TPLNR_EXT,
                    PLTXT: oEquipment.PLTXT,
                    ABCKZ: oEquipment.ABCKZ,
                    KOSTL: oEquipment.KOSTL
                })
                self.mNotification.refresh();
            });
        },

        onSave: function(oEvent) {
            var oRequestData = Object.assign({
                ANLZU: "0",
                AUSBS: "",
                AUSVN: "",
                AUZTB: "000000",
                AUZTV: "000000",
                FECOD: "",
                FEGRP: "",
                FEKAT: "",
                FETXT: "",
                QMTXT: "",
                MSAUS: " ",
                OTKAT: "",
                PRIOK: "",
                QMART: "M1",
                QMDAT: Utilities.date.currDateFormatted(),
                URCOD: "",
                URGRP: "",
                URKAT: "",
                URTXT: "",
                INACTIVEWO: "False"
            }, this.mNotification.getData());

            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/workorder_notification",
                method: "POST",
                data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CreateSuccess"), {
                        closeOnBrowserNavigation: false
                    });
                    self.oRouter.navTo("detail", {
                        AUFNR: oResponseData.OBJECT_KEY
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onCancel: function(oEvent) {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            this.mMaterials.setData([]);

            if (sPreviousHash) {
                window.history.go(-1);
            } else {
                this.oRouter.navTo("list", {}, true);
            }
        },

        onDamageCodeSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("selectedItem");
            var oContext = oListItem.getBindingContext("odata");
            var oDamageCode = oContext.getModel().getProperty(oContext.getPath());

            this.mNotification.setProperty("/FEGRP", oDamageCode.FEGRP);
            this.mNotification.setProperty("/FETXT", oDamageCode.FETXT);
        },

        onCauseCodeSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("selectedItem");
            var oContext = oListItem.getBindingContext("odata");
            var oCauseCode = oContext.getModel().getProperty(oContext.getPath());

            this.mNotification.setProperty("/URGRP", oCauseCode.URGRP);
            this.mNotification.setProperty("/URTXT", oCauseCode.URTXT);
        },

        onBreakdownSelect: function(oEvent) {
            var sMSAUS = oEvent.getParameter("selected") ? "X" : " ";
            this.mNotification.setProperty("/MSAUS", sMSAUS);
        },

        getText: function(sKey, aArgs) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                this.oI18n = this.oI18n || mI18n.getResourceBundle();
                if (this.oI18n) {
                    return this.oI18n.getText(sKey, aArgs);
                }
            }
            return "";
        }
    });
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectEquipmentDialog));