jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");

(function(Utilities, DataAccess, SelectEquipmentDialog, SelectGenericDialog) {
    sap.ui.controller("dep.fiori.wonotification.app.detail", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");

            this.mNotification = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mNotification);
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "detail") {
                var oArgs = oEvent.getParameter("arguments");
                if (this.sAUFNR !== oArgs.AUFNR) {
                    this.sAUFNR = oArgs.AUFNR;
                    this.loadNotification();
                }
            }
        },

        loadNotification: function() {
            var sURL = "/ws_restful_data_controller/workorder_notification?AUFNR=" + this.sAUFNR;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mNotification.setData(oResponseData);
            }));
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
                method: "PUT",
                data: JSON.stringify([ oRequestData ])
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

        onCancel: function(oEvent) {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            //this.mMaterials.setData([]);

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

        toWorkOrder: function(oEvent) {
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "#depWorkorder-display&/" + this.sAUFNR
                }
            });
        },

        createWorkOrder: function(oEvent) {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("dep.fiori.wonotification.app.newWorkOrder", this);
                this.getView().addDependent(this.oDialog);

                this.mActivity = new sap.ui.model.json.JSONModel({});
                this.getView().setModel(this.mActivity, "activityTypes");

                this.mWorkcenter = new sap.ui.model.json.JSONModel({});
                this.getView().setModel(this.mWorkcenter, "workcenter");

                this.mPriority = new sap.ui.model.json.JSONModel({});
                this.getView().setModel(this.mPriority, "priority");

                var self = this;
                $.ajax("/ws_restful_data_controller/workorder_activity_type?AUART=PM01").done(function(aResponseData) {
                    self.mActivity.setData(aResponseData);
                });

                $.ajax("/ws_restful_data_controller/workcenter").done(function(aResponseData) {
                    self.mWorkcenter.setData(aResponseData);
                });

                $.ajax("/ws_restful_data_controller/workorder_priority").done(function(aResponseData) {
                    self.mPriority.setData(aResponseData);
                });
            }

            this.oDialog.open();
        },

        closeWorkOrderDialog: function() {
            if (this.oDialog.isOpen()) {
                this.oDialog.close();
            }
        },

        workcenterPress: function(oEvent) {
            var oInput = oEvent.getSource();
            dep.fiori.lib.util.SelectGenericDialog.getEntity({
                sEntityPath: "/Workcenter",
                aColumns: [
                    {
                        sHeader: this.getText("Operations.workCenter"),
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
        },

        saveWorkOrder: function() {
            var oPromise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            $.ajax("/ws_restful_data_controller/default_values?for_object=workorder").done(function(oResponseData) {
                var oDefaultFields = {
                    IS_EXTERNAL: "",
                    ANLZU: "", //system condition
                    ARBEI: "", //work involved in the activity
                    AUART: "", //order type
                    STEUS: "", //control key
                    USER_STATUS: "",
                    VORNR: "",
                    GSTRP: Utilities.date.toYYYYMMDD(new Date()),
                    GLTRP: "00000000"
                };

                oResponseData.USER_STATUS = oResponseData.USER_STATUS || "INPL";
                oResponseData.AUART = oResponseData.AUART || "ZM01";
                oResponseData.STEUS = oResponseData.STEUS || "ZINT";

                var oRequestData = Object.assign(oDefaultFields, oResponseData, self.mNotification.getData());

                var aActivityTypes = self.mActivity.getData();
                for (var i = 0; i < aActivityTypes.length; i++) {
                    if (aActivityTypes[i].ILART === oRequestData.ILART) {
                        oRequestData.ILATX = aActivityTypes[i].ILATX
                        break;
                    }
                }

                var aPriorityItems = self.mPriority.getData();
                for (var x = 0; x < aActivityTypes.length; x++) {
                    if (aActivityTypes[x].PRIOK === oRequestData.PRIOK) {
                        oRequestData.PRIOKX = aActivityTypes[x].PRIOKX
                        break;
                    }
                }

                oRequestData.KTEXT = oRequestData.QMTXT;

                $.ajax({
                    url: "/ws_restful_data_controller/workorder",
                    data: JSON.stringify(oRequestData),
                    method: "POST",
                    headers: {
                        AUFNR: oRequestData.AUFNR
                    }
                }).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }

                    if (oResponseData.ErrorID) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                        oPromise.reject();
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.WorkOrderCreateSuccess"), {
                            closeOnBrowserNavigation: false
                        });
                        oPromise.resolve();
                        self.toWorkOrder();
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                    oPromise.reject();
                });
            }).fail(function() {
                oPromise.reject();
            });

            return oPromise;
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
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectEquipmentDialog, dep.fiori.lib.util.SelectGenericDialog));