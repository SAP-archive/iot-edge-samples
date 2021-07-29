jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, SelectEquipmentDialog, SelectGenericDialog, Utilities) {
    CreateControllerBase.extend("dep.fiori.notification.app.create", {
        onInit: function() {
            this.setListRoute("list");
            CreateControllerBase.prototype.onInit.apply(this, arguments);

            this.mNotification = this.getObjectModel();
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

        onDamageCodeValueHelp: function(oEvent) {
            var self = this;
            SelectGenericDialog.getEntity({
                sEntityPath: "/Damage_Code",
                aColumns: [
                    { sHeader: "{i18nGlobal>DamageCodeSelect.group}", sField: "FEGRP" },
                    { sHeader: "{i18nGlobal>DamageCodeSelect.code}", sField: "FECOD" },
                    { sHeader: "{i18nGlobal>DamageCodeSelect.text}", sField: "FETXT" }
                ]
            }).done(function(oDamageCode) {
                Object.assign(self.mNotification.getData(), {
                    FEGRP: oDamageCode.FEGRP,
                    FECOD: oDamageCode.FECOD,
                    FETXT: oDamageCode.FETXT
                })
                self.mNotification.refresh();
            });
        },

        onCauseCodeValueHelp: function(oEvent) {
            var self = this;
            SelectGenericDialog.getEntity({
                sEntityPath: "/Cause_Code",
                aColumns: [
                    { sHeader: "{i18nGlobal>CauseCodeSelect.group}", sField: "URGRP" },
                    { sHeader: "{i18nGlobal>CauseCodeSelect.code}", sField: "URCOD" },
                    { sHeader: "{i18nGlobal>CauseCodeSelect.text}", sField: "URTXT" }
                ]
            }).done(function(oCauseCode) {
                Object.assign(self.mNotification.getData(), {
                    URGRP: oCauseCode.URGRP,
                    URCOD: oCauseCode.URCOD,
                    URTXT: oCauseCode.URTXT
                })
                self.mNotification.refresh();
            });
        },

        onSave: function(oEvent) {
            var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR1"));
                return;
            }

            var oRequestData = Object.assign({
                ANLZU: "0",
                AUSBS: Utilities.date.currDateFormatted(),
                AUSVN: Utilities.date.currDateFormatted(),
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
                WERKS: "",
                INACTIVEWO: "True",
                KTEXT: "INACTIVE_PLACEHOLDER_WORKORDER"
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
                    self.getRouter().navTo("detail", {
                        AUFNR: oResponseData.OBJECT_KEY
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        resetModelData: function() {
            this.mNotification.setData([]);
        },

        onBreakdownSelect: function(oEvent) {
            var sMSAUS = oEvent.getParameter("selected") ? "X" : " ";
            this.mNotification.setProperty("/MSAUS", sMSAUS);
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.SelectEquipmentDialog, dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.Utilities));