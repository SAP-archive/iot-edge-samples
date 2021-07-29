jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.UserStatus");
jQuery.sap.require("dep.fiori.lib.util.SelectDamageCodeDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectCauseCodeDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities, UserStatus, SelectEquipmentDialog, SelectGenericDialog
     , SelectDamageCodeDialog, SelectCauseCodeDialog) {
    DetailBlockControllerBase.extend("dep.fiori.workorder.block.detail", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setBlockId("detail");
        },

        onAfterRendering: function(oEvent) {
        	DetailBlockControllerBase.prototype.onAfterRendering.apply(this, arguments);
            this.mWorkorder = this.getView().getModel();
        },
        
        // Override DetailBlockControllerBase.loadData
        loadData: function(oKey) {
        	this.loadWorkorder(oKey);
        },

        loadWorkorder: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mWorkorder.setData(oResponseData);
            }));
        },

        onEdit: function(oEvent) {
            this.acquireLock();
        },

        onCancel: function(oEvent) {
            this.releaseLock();
            this.loadWorkorder(this.mWorkorder.getProperty("/AUFNR"));
        },

        onSave: function(oEvent) {
            var self = this;

            var sLTXT = this.mWorkorder.getProperty("/WO_LTXT");
            var sAppend = this.mWorkorder.getProperty("/WO_LTXT_ADD");
            if (sLTXT && sAppend && sAppend.substring(0, 2) !== "\n") {
                this.mWorkorder.setProperty("/WO_LTXT_ADD", "\n" + sAppend);
            }

            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/workorder",
                method: "PUT",
                data: this.mWorkorder.getJSON()
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.Parameter3 ]));
                } else {
                    self.releaseLock();
                    self.loadWorkorder(self.mWorkorder.getProperty("/AUFNR"));
                }
            }));
        },

        onEquipmentValueHelp: function(oEvent) {
            var self = this;
            SelectEquipmentDialog.getEquipment().done(function(oEquipment) {
                Object.assign(self.mWorkorder.getData(), {
                    EQUNR: oEquipment.EQUNR,
                    EQKTX: oEquipment.EQKTX,
                    TPLNR: oEquipment.TPLNR,
                    TPLNR_EXT: oEquipment.TPLNR_EXT,
                    PLTXT: oEquipment.PLTXT,
                    ABCKZ: oEquipment.ABCKZ,
                    KOSTL: oEquipment.KOSTL
                })
                self.mWorkorder.refresh();
            });
        },

        onWorkcenterValueHelp: function(oEvent) {
            var oInput = oEvent.getSource();
            var self = this;
            $.ajax("/ws_restful_data_controller/workcenter").done(function(aResponseData) {
                dep.fiori.lib.util.SelectGenericDialog.getEntity({
                    // sEntityPath: "/Workcenter",
                    sEntityPath: aResponseData,
                    aColumns: [
                        {
                            sHeader: self.getText("Operations.workCenter"),
                            sField: "VAPLZ"
                        },
                        {
                            sHeader: dep.fiori.lib.util.Utilities.geti18nGlobal("General.description"),
                            sField: "KTEXT"
                        }
                    ]
                }).done(function(oWorkcenter) {
                    oInput.setValue(oWorkcenter.VAPLZ);
                });
            });
        },

        ondamagecodeValueHelp: function(oEvent) {
            var self = this;
            SelectDamageCodeDialog.getDamageCode().done(function(oDamageCode) {
                Object.assign(self.mWorkorder.getData(), {
                    FEGRP: oDamageCode.FEGRP,
                    FECOD: oDamageCode.FECOD,
                    FETXT: oDamageCode.FETXT
                })
                self.mWorkorder.refresh();
            });
        },

        oncausecodeValueHelp: function(oEvent) {
            var self = this;
            SelectCauseCodeDialog.getCauseCode().done(function(oCauseCode) {
                Object.assign(self.mWorkorder.getData(), {
                    URGRP: oCauseCode.URGRP,
                    URCOD: oCauseCode.URCOD,
                    URTXT: oCauseCode.URTXT
                })
                self.mWorkorder.refresh();
            });
        },

        onBreakdownSelect: function(oEvent) {
            var sMSAUS = oEvent.getParameter("selected") ? "X" : " ";
            this.mWorkorder.setProperty("/MSAUS", sMSAUS);
        },

        classificationTextFormatter: function(sABCKZ, aCriticality) {
            for (var i = aCriticality.length - 1; i >= 0; i--) {
                if (sABCKZ !== "" && aCriticality[i].CRITICALITY_CODE === sABCKZ) {
                    return aCriticality[i].CRITICALITY_DESCRIPTION;
                }
            }
            return "";
        },

        classificationStateFormatter: function(sABCKZ, aCriticality) {
            switch (sABCKZ) {
                case "A":
                    return sap.ui.core.ValueState.Error;
                    break;
                case "B":
                    return sap.ui.core.ValueState.Warning;
                    break;
                case "C":
                    return sap.ui.core.ValueState.Success;
                    break;
                case "D":
                    return sap.ui.core.ValueState.None;
                    break;
                default:
                    return sap.ui.core.ValueState.None;
            }
            return sap.ui.core.ValueState.None;
        },

        getUserStatus: function() {
            var mWorkorder = this.mWorkorder;
            var sCurrent = mWorkorder.getProperty("/USER_STATUS");
            var sCurrentMobile = mWorkorder.getProperty("/MOBILE_STATUS");
            var sCanComplete = mWorkorder.getProperty("/CAN_COMPLETE");

            var self = this;
            UserStatus.getUserStatus(sCurrent, sCanComplete).done(function(sUserStatus, sMobileStatus) {
                if (sUserStatus !== sCurrent) {
                    mWorkorder.setProperty("/USER_STATUS", sUserStatus);
                    mWorkorder.setProperty("/MOBILE_STATUS", sMobileStatus);
                    self.saveStatus().done(function(oResponseData) {
                        if (Array.isArray(oResponseData)) {
                            oResponseData = oResponseData[0];
                        }

                        if (oResponseData.ErrorID) {
                            sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                            mWorkorder.setProperty("/USER_STATUS", sCurrent);
                            mWorkorder.setProperty("/MOBILE_STATUS", sCurrentMobile);
                        } else {
                            if (sUserStatus.indexOf("CANX") > -1) {
                                sap.m.MessageToast.show(self.getText("ToastMessage.CancelWorkOrderSuccess"));
                            } else {
                                sap.m.MessageToast.show(self.getText("ToastMessage.SaveWorkOrderSuccess"));
                            }
                        }
                    }).fail(function() {
                        sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                        mWorkorder.setProperty("/USER_STATUS", sCurrent);
                        mWorkorder.setProperty("/MOBILE_STATUS", sCurrentMobile);
                    });
                }
            });
        },

        saveStatus: function() {
            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/workorder_userstatuses?AUFNR=" + this.mWorkorder.getProperty("/AUFNR"),
                method: "PUT",
                data: this.mWorkorder.getJSON()
            }).done(function(oResponseData) {
                self.releaseLock();
                self.loadWorkorder(self.mWorkorder.getProperty("/AUFNR"));
            }));
        },

        acquireLock: function(bOverride) {
            this.getView().getModel("lock").getProperty("/acquireLock").call(this, bOverride);
        },

        releaseLock: function() {
            this.getView().getModel("lock").getProperty("/releaseLock").call(this);
        },

        isEditable: function(bHasLock, sUSERSTATUS) {
            return bHasLock && !sUSERSTATUS.startsWith("CMPL") && !sUSERSTATUS.startsWith("TECO");
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.UserStatus, dep.fiori.lib.util.SelectEquipmentDialog, dep.fiori.lib.util.SelectGenericDialog
, dep.fiori.lib.util.SelectDamageCodeDialog, dep.fiori.lib.util.SelectCauseCodeDialog));