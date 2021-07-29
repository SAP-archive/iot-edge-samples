jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities, DataAccess, SelectEquipmentDialog, SelectGenericDialog) {
    DetailControllerBase.extend("dep.fiori.notification.app.detail", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setListRoute("list");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mOData = DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");

            this.mNotification = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mNotification);

            this.mWorkorder = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mWorkorder, "workorder");
        },
        
        loadData: function(sAUFNR) {
            this.loadNotification(sAUFNR);
        },

        loadNotification: function(sAUFNR) {
            var self = this;
            var sURL = "/ws_restful_data_controller/workorder_notification?AUFNR=" + sAUFNR;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mNotification.setData(oResponseData);
                self.checkWOExists(oResponseData.WO_EXISTS);
                self.loadWorkorder(sAUFNR).done(function(woResponseData) {
                    if (Array.isArray(woResponseData)) {
                        woResponseData = woResponseData[0];
                    }
                    Object.assign(self.mNotification.getData(), {
                        KTEXT: woResponseData.KTEXT,
                        VAPLZ: woResponseData.VAPLZ,
                        ILART: woResponseData.ILART,
                        GSTRP: woResponseData.GSTRP,
                        GLTRP: woResponseData.GLTRP,
                        ANLZU: woResponseData.ANLZU,
                        AUART: woResponseData.AUART,
                        IS_EXTERNAL: woResponseData.IS_EXTERNAL,
                        GSUZP: woResponseData.GSUZP,
                        GLUZP: woResponseData.GLUZP,
                        USER_STATUS: woResponseData.USER_STATUS,
                        MOBILE_STATUS: woResponseData.MOBILE_STATUS,
                        WO_LTXT_ADD: woResponseData.WO_LTXT_ADD,
                        CHG_REASON: woResponseData.CHG_REASON,
                        PRIOK: woResponseData.PRIOK
                    })
                    self.mNotification.refresh();
                });
            }));
        },

        loadWorkorder: function(sAUFNR) {
            var self = this;
            var sURL = "/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mWorkorder.setData(oResponseData);
            }));
        },

        checkWOExists: function(WO_EXISTS) {
            if (WO_EXISTS == 'X') {
                this.getWOStatus = "False";
            } else {
                this.getWOStatus = "True";
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
             var self = this;
             self.mNotification.setProperty("/INACTIVEWO", this.getWOStatus);
             Utilities.showBusyIndicator($.ajax({
                 url: "/ws_restful_data_controller/workorder_notification",
                 method: "PUT",
                 data: JSON.stringify([self.mNotification.getData()])
             }).done(function(oResponseData) {
                 if (Array.isArray(oResponseData)) {
                     oResponseData = oResponseData[0];
                 }

                 if (oResponseData.ErrorID) {
                     sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                 } else {
                     sap.m.MessageToast.show(self.getText("ToastMessage.UpdateSuccess"), {
                         closeOnBrowserNavigation: false
                     });
                 }
             }).fail(function() {
                 sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
             }));
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

        onBreakdownSelect: function(oEvent) {
            var sMSAUS = oEvent.getParameter("selected") ? "X" : " ";
            this.mNotification.setProperty("/MSAUS", sMSAUS);
        },

        onWorkCenterPress: function(oEvent) {
            var oInput = oEvent.getSource();
            SelectGenericDialog.getEntity({
                sEntityPath: "/Workcenter",
                aColumns: [
                    {
                        sHeader: this.getText("WorkOrder.workCenter"),
                        sField: "VAPLZ"
                    },
                    {
                        sHeader: Utilities.geti18nGlobal("General.description"),
                        sField: "KTEXT"
                    }
                ]
            }).done(function(oWorkcenter) {
                oInput.setValue(oWorkcenter.VAPLZ);
            });
        },

        onViewWorkOrderPress: function(oEvent) {
            var sHash = "#depWorkorder-display&/" + this.getKeyValue();
            Utilities.navToExternal(sHash);
        },

        onCreateWorkOrderPress: function(oEvent) {
            var self = this;
            self.loadWorkorder(this.getKeyValue()).done(function() {
                if (!self.oWorkorderDialog) {
                    self.oWorkorderDialog = sap.ui.xmlfragment("dep.fiori.notification.app.newWorkOrder", self);
                    self.getView().addDependent(self.oWorkorderDialog);
    
                    self.mActivity = new sap.ui.model.json.JSONModel({});
                    self.getView().setModel(self.mActivity, "activityTypes");
    
                    $.ajax("/ws_restful_data_controller/workorder_activity_type?AUART=PM01").done(function(aResponseData) {
                        self.mActivity.setData(aResponseData);
                    });
                }
                self.oWorkorderDialog.open();
            });
        },

        validateWorkOrder: function() {
            var sDate = this.mNotification.getProperty("/GSTRP");
            var sDescription = this.mNotification.getProperty("/WO_DESC");
            var sWorkcenter = this.mNotification.getProperty("/VAPLZ");
            var sActivityType = this.mNotification.getProperty("/ILART");
            
            return sDate && sDescription && sWorkcenter && sActivityType;
        },

        saveWorkOrder: function() {
            var self = this;

            if (!this.validateWorkOrder()) {
                sap.m.MessageToast.show(self.getText("Error.ERR1"), {
                    closeOnBrowserNavigation: false
                });
                return;
            }

            self.mWorkorder.setProperty("/KTEXT", self.mNotification.getProperty("/WO_DESC"));
            self.mWorkorder.setProperty("/GSTRP", self.mNotification.getProperty("/GSTRP"));
            self.mWorkorder.setProperty("/GLTRP", self.mNotification.getProperty("/GSTRP"));
            self.mWorkorder.setProperty("/ILART", self.mNotification.getProperty("/ILART"));
            self.mWorkorder.setProperty("/VAPLZ", self.mNotification.getProperty("/VAPLZ"));
            self.mWorkorder.setProperty("/PRIOK", self.mNotification.getProperty("/PRIOK"));
            self.mWorkorder.setProperty("/QMTXT", self.mNotification.getProperty("/QMTXT"));
            self.mWorkorder.setProperty("/QMDAT", self.mNotification.getProperty("/QMDAT"));

            var aActivityTypes = self.mActivity.getData();
            var sILART = self.mNotification.getProperty("/ILART");
            for (var x = 0; x < aActivityTypes.length; x++) {
                if (aActivityTypes[x].ILART === sILART) {
                    self.mWorkorder.setProperty("/ILATX", aActivityTypes[x].ILATX);
                    break;
                }
            }
            Object.assign(self.mWorkorder, self.mNotification.getData());
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/workorder",
                method: "PUT",
                data: self.mWorkorder.getJSON()
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.Parameter3 ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.WorkOrderCreateSuccess"), {
                        closeOnBrowserNavigation: false
                    });
                    self.toWorkOrder();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                oPromise.reject();
            }));
        },
        
        toWorkOrder: function(oEvent) {
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "#depWorkorder-display"
                }
            });
        },

        onCancelNotificationPress: function() {
            var self = this;
            self.loadWorkorder(this.getKeyValue()).done(function() {
                if (self.mWorkorder.getProperty("/USER_STATUS") == "INPL" || self.mWorkorder.getProperty("/USER_STATUS") == 'WFRV') {
                    if (!self.oCancelDialog) {
                        self.oCancelDialog = sap.ui.xmlfragment("dep.fiori.notification.app.cancelNotification", self);
                        self.getView().addDependent(self.oCancelDialog);
                    }
                    self.oCancelDialog.open();
                } else {
                    sap.m.MessageToast.show(self.getText("Cancel.cannotCancel", self.mWorkorder.getProperty("/USER_STATUS")));
                }
            });
        },

        cancelNotification: function() {
            var self = this;
            var oPromise = Utilities.showBusyIndicator($.Deferred());

            var oRequestData = Object.assign({
                 "AUFNR": this.getKeyValue()
            });

            Utilities.showBusyIndicator($.ajax({
                  url: "/ws_restful_data_controller/cancel_notification?AUFNR=" + this.getKeyValue(),
                  method: "PUT",
                  data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }
                    if (oResponseData.STATUS == "200") {
                       sap.m.MessageToast.show(self.getText("ToastMessage.NotificationCancelSuccess"));
                       self.getRouter().navTo("list", {}, true);
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.NotificationCancelFailed"));
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                }
            ));
        },

        closeWorkOrderDialog: function() {
            if (this.oWorkorderDialog.isOpen()) {
                this.oWorkorderDialog.close();
            }
        },

        closeCancelDialog: function() {
            if (this.oCancelDialog.isOpen()) {
                this.oCancelDialog.close();
            }
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var aTransactions = this.mNotification.getProperty("/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oEvent.getSource(), aTransactions);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectEquipmentDialog, dep.fiori.lib.util.SelectGenericDialog));