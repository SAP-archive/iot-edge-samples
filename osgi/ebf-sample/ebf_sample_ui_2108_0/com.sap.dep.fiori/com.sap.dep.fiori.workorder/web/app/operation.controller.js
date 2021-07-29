jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectFromBOMDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities, DataAccess, Filter, SelectMaterialDialog, BOMDialog, SelectGenericDialog) {
    DetailControllerBase.extend("dep.fiori.workorder.app.operation", {
        onInit: function() {
            this.setKey([ "AUFNR", "VORNR" ]);
            this.setDetailRoute("operation");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mOperation = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mOperation);

            this.mWorkorder = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mWorkorder, "workorder");

            this.mComponents = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mComponents, "components");

            this.mConfirmations = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mConfirmations, "confirmations");

            this.mNewConfirmation = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mNewConfirmation, "newConfirmation");

            var self = this;
            DataAccess.getLookupModel({
                workcenter: "workcenter",
                controlkey: "workorder_operations"
            }).done(function(mLookup) {
                self.getView().setModel(mLookup, "lookup");
            });

            this.mState = new sap.ui.model.json.JSONModel({
                editing: false
            });
            this.getView().setModel(this.mState, "state");

            this.mTableState = new sap.ui.model.json.JSONModel({
                editing: false
            });
            this.getView().setModel(this.mTableState, "tableState");

            this.mConfirmationState = new sap.ui.model.json.JSONModel({
                editing: false
            });
            this.getView().setModel(this.mConfirmationState, "confirmationState");
            
            this.mComponentsFilter = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mComponentsFilter, "componentsFilter");
            
            this.oComponentsList = this.byId("componentsList");
            
            this.byId("filterBar").addStyleClass("workorderComponentsFilterBar");
            Filter.setFilterModels(this.getView(), this.getFilterItems());
        },

        loadData: function(oKey) {
            this.sAUFNR = oKey.AUFNR;
            this.sVORNR = oKey.VORNR;
            this.mOperation.setData({});
            this.mComponents.setData([]);
            return Utilities.showBusyIndicator($.when(
                this.loadOperation(this.sAUFNR, this.sVORNR),
                this.loadComponents(this.sAUFNR, this.sVORNR),
                this.loadConfirmations(this.sAUFNR, this.sVORNR),
                this.loadWorkorder(this.sAUFNR)
            ));
        },

        loadWorkorder: function(sAUFNR) {
            var self = this;
            return $.ajax("/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.oWorkorder = oResponseData;
                self.mWorkorder.setData(self.oWorkorder);

                var mBOMExists;
                if (self.oWorkorder.USER_STATUS.substr(0, 4) !== 'CMPL' && self.oWorkorder.USER_STATUS.substr(0, 4) !== 'TECO') {
                    mBOMExists = new sap.ui.model.json.JSONModel("/ws_restful_data_controller/bom_exists?EQUNR=" + self.oWorkorder.EQUNR);
                } else {
                    mBOMExists = new sap.ui.model.json.JSONModel({});
                }
                self.getView().setModel(mBOMExists, "bomExists");
            });
        },

        loadOperation: function(sAUFNR, sVORNR) {
            var sQuery = Utilities.getQueryString({
                AUFNR: sAUFNR,
                VORNR: sVORNR
            });
            var sURL = "/ws_restful_data_controller/workorder_operations" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                for (var i = aResponseData.length - 1; i >= 0; i--) {
                    if (aResponseData[i].VORNR === sVORNR) {
                        self.mOperation.setData(aResponseData[i]);
                        break;
                    }
                }
            });
        },

        refreshComponents: function(oEvent) {
            this.mComponents.setData([]);
            Utilities.showBusyIndicator(this.loadComponents(this.sAUFNR, this.sVORNR));
        },

        loadComponents: function(sAUFNR, sVORNR) {
            var sQuery = Utilities.getQueryString({
                AUFNR: sAUFNR,
                VORNR: sVORNR
            });
            var sURL = "/ws_restful_data_controller/workorder_components_list" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                for (var i = aResponseData.length - 1; i >= 0; i--) {
                    aResponseData[i].CUD_IND = "";
                }
                self.mComponents.setData(aResponseData);
            });
        },

        refreshConfirmations: function(oEvent) {
            this.mConfirmations.setData([]);
            Utilities.showBusyIndicator(this.loadConfirmations(this.sAUFNR, this.sVORNR));
        },

        loadConfirmations: function(sAUFNR, sVORNR) {
            var sQuery = Utilities.getQueryString({
                AUFNR: sAUFNR,
                VORNR: sVORNR
            });
            var sURL = "/ws_restful_data_controller/operation_confirmation" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                self.mConfirmations.setData(aResponseData);
            });
        },

        onEdit: function(oEvent) {
            var self = this;
            this.acquireLock().done(function() {
                self.mState.setProperty("/editing", true);
            });
        },

        onSave: function(oEvent) {
            var promise = Utilities.showBusyIndicator($.Deferred());
            var self = this;
            $.ajax({
                url: "/ws_restful_data_controller/workorder_operations",
                method: "PUT",
                data: this.mOperation.getJSON()
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.releaseLock().always(function() {
                        self.mState.setProperty("/editing", false);
                    });
                    self.loadOperation(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.SaveOperationSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise.done();
        },

        onCancel: function(oEvent) {
            var self = this;
            this.releaseLock().always(function() {
                self.mState.setProperty("/editing", false);
                Utilities.showBusyIndicator(self.loadOperation(self.sAUFNR, self.sVORNR));
            });
        },

        onWorkcenterValueHelp: function(oEvent) {
            var oInput = oEvent.getSource();
            dep.fiori.lib.util.SelectGenericDialog.getEntity({
                // sEntityPath: "/Workcenter",
                sEntityPath: this.getView().getModel("lookup").getProperty("/workcenter"),
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

        onTableEdit: function(oEvent) {
            var self = this;
            this.acquireLock().done(function() {
                self.mTableState.setProperty("/editing", true);
            });
        },

        onTableSave: function(oEvent) {
            var self = this;
            this.saveComponentQuantities().done(function() {
                self.releaseLock().always(function() {
                    self.mTableState.setProperty("/editing", false);
                });
            });
        },

        onTableCancel: function(oEvent) {
            var self = this;
            this.releaseLock().always(function() {
                self.mTableState.setProperty("/editing", false);
            });
        },

        onQuantityChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var oContext = oInput.getBindingContext("components");
            var oComponent = oContext.getModel().getProperty(oContext.getPath());
            oComponent.CUD_IND = "U";
            oContext.getModel().setProperty(oContext.getPath(), oComponent);
        },

        saveComponentQuantities: function(oEvent) {
            var promise = Utilities.showBusyIndicator($.Deferred());

            var oRequestBody = this.buildRequestBody();
            var self = this;
            $.ajax({
                url: "/ws_restful_data_controller/workorder_components",
                method: "PUT",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.loadComponents(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.UpdateComponentSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        onAddMaterial: function(oEvent) {
            var self = this;
            SelectMaterialDialog.getMaterial().done(function(aMaterials) {
                if (aMaterials.length > 0) {
                    var aComponents = self.mComponents.getData();
                    aComponents.push.apply(aComponents, aMaterials.map(function(oMaterial) {
                        return Object.assign(oMaterial, {
                            BDMNG: 1,
                            POSTP: "L",
                            CUD_IND: "C",
                            GPREIS: oMaterial.PREIS,
                            RMAKTX: oMaterial.MAKTX,
                            RMEINS: oMaterial.MEINS
                        });
                    }));
                    self.saveComponents(oEvent);
                }
            });
        },

        onAddTextItem: function(oEvent) {
            var oDialog = this.getTextComponentDialog();
            oDialog.getModel().setData({
                "BDMNG": "",
                "CUD_IND": "C",
                "ENMNG": "",
                "GPREIS": "",
                "MAKTX": "",
                "MATNR": "",
                "MEINS": "",
                "POSNR": "",
                "POSTP": "N",
                "POTX1": "",
                "RMAKTX": "",
                "RMEINS": "",
                "RSNUM": "",
                "RSPOS": "",
                "SGTXT": "",
                "TBMNG": "",
                "VORNR": this.sVORNR,
                "WAERS": ""
            });
            oDialog.open();
        },

        onEditTextItem: function(oEvent) {
            var oBinding = oEvent.getSource().getBindingContext("components");
            var oComponent = oBinding.getModel().getProperty(oBinding.getPath());
            var oDialog = this.getTextComponentDialog();
            var sQuery = Utilities.getQueryString({
                AUFNR: oComponent.AUFNR,
                VORNR: oComponent.VORNR,
                POSNR: oComponent.POSNR,
                RSPOS: oComponent.RSPOS
            });

            var self = this;
            $.ajax("/ws_restful_data_controller/component_ltxt" + sQuery).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    oComponent.SGTXT = oResponseData.SGTXT;
                    oDialog.getModel().setData(Object.assign({}, oComponent));
                    oDialog.open();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        },

        saveTextItem: function() {
            var oTextComponent = this.getTextComponentDialog().getModel().getData();

            if (oTextComponent.CUD_IND !== "C") {
                oTextComponent.CUD_IND = "U";
            }

            var oRequestBody = Object.assign({}, this.oWorkorder);
            oRequestBody.ComponentsArr = [
                oTextComponent
            ];

            var self = this;
            return $.ajax({
                url: "/ws_restful_data_controller/workorder_components",
                method: "POST",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.closeTextComponentDialog();
                    self.loadComponents(self.sAUFNR, self.sVORNR);
                    sap.m.MessageToast.show(self.getText("ToastMessage.AddComponentSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        },

        getTextComponentDialog: function() {
            if (!this.textComponentDialog) {
                this.textComponentDialog = sap.ui.xmlfragment("dep.fiori.workorder.app.textComponent", this);
                this.textComponentDialog.setModel(new sap.ui.model.json.JSONModel());

                var mCurrencies = new sap.ui.model.json.JSONModel();
                mCurrencies.setSizeLimit(9999);
                this.textComponentDialog.setModel(mCurrencies, "currencies");

                var mUnits = new sap.ui.model.json.JSONModel();
                mUnits.setSizeLimit(9999);
                this.textComponentDialog.setModel(mUnits, "units");
                this.getView().addDependent(this.textComponentDialog);

                var self = this;
                $.ajax("/ws_restful_data_controller/currencies").done(function(oResponseData) {
                    mCurrencies.setData(oResponseData);
                });

                $.ajax("/ws_restful_data_controller/units_of_measure").done(function(oResponseData) {
                    mUnits.setData(oResponseData);
                });
            }
            return this.textComponentDialog;
        },

        closeTextComponentDialog: function() {
            this.getTextComponentDialog().close();
        },

        onTextComponentDialogClose: function() {
            this.getTextComponentDialog().getModel().setData({});
        },

        onAddBOM: function(oEvent) {
            var self = this;
            BOMDialog.getMaterial(this.oWorkorder.EQUNR).done(function(aMaterials) {
                if (aMaterials.length > 0) {
                    var aComponents = self.mComponents.getData();
                    aComponents.push.apply(aComponents, aMaterials.map(function(oMaterial) {
                        return Object.assign(oMaterial, {
                            MATNR: oMaterial.IDNRK,
                            BDMNG: 1,
                            POSTP: "L",
                            CUD_IND: "C",
                            GPREIS: oMaterial.PREIS,
                            RMAKTX: oMaterial.MAKTX,
                            RMEINS: oMaterial.MEINS
                        });
                    }));
                    self.saveComponents(oEvent);
                }
            });
        },

        saveComponents: function(oEvent) {
            var promise = Utilities.showBusyIndicator($.Deferred());

            var oRequestBody = this.buildRequestBody();
            var self = this;
            $.ajax({
                url: "/ws_restful_data_controller/workorder_components",
                method: "POST",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.loadComponents(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.AddComponentSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        buildRequestBody: function() {
            var aComponents = this.mComponents.getData();

            // Ensure all components in array have same format
            // this.oWorkorder.VORNR = this.sVORNR;
            var sVORNR = this.mOperation.getProperty("/VORNR");
            this.oWorkorder.ComponentsArr = this.mComponents.getData().map(function(oComponent) {
                return {
                    VORNR: oComponent.VORNR || sVORNR,
                    POSNR: oComponent.POSNR || "",
                    RSNUM: oComponent.RSNUM || "",
                    RSPOS: oComponent.RSPOS || "",
                    MATNR: oComponent.MATNR,
                    BDMNG: oComponent.BDMNG,
                    POSTP: oComponent.POSTP,
                    GPREIS: oComponent.GPREIS,
                    RMAKTX: oComponent.RMAKTX,
                    RMEINS: oComponent.RMEINS,
                    ENMNG: oComponent.ENMNG || "",
                    TBMNG: oComponent.TBMNG || "",
                    POTX1: oComponent.POTX1 || "",
                    MISKZ: oComponent.MISKZ || "",
                    SGTXT: oComponent.SGTXT || "",
                    CUD_IND: oComponent.CUD_IND
                };
            });

            return this.oWorkorder;
        },

        onRemoveComponent: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("components");
            var oComponent = oContext.getModel().getProperty(oContext.getPath());

            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(this.getText("Components.confirmDelete", [ oComponent.MATNR ]), {
                title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                icon: sap.m.MessageBox.Icon.WARNING,
                actions: [
                    sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === "OK") {
                        self.removeComponent(oComponent);
                    }
                }
            });
        },

        removeComponent: function(oComponent) {
            var sQuery = Utilities.getQueryString({
                AUFNR: oComponent.AUFNR,
                VORNR: oComponent.VORNR,
                POSNR: oComponent.POSNR,
                RSPOS: oComponent.RSPOS
            });

            var promise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            $.ajax({
                url: "/ws_restful_data_controller/workorder_components" + sQuery,
                method: "DELETE"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.loadComponents(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.RemoveComponentSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        onAddConfirmation: function(oEvent) {
            this.mNewConfirmation.setData({
                AUFNR: this.sAUFNR,
                VORNR: this.sVORNR,
                ARBPL: "",
                LTXA1: "",
                ISMNW: 0,
                OFMNW: 0,
                IDAUR: 0,
                STOKZ: " ",
                AUERU: " "
            });
            this.mConfirmationState.setProperty("/editing", true);
        },

        onSelectFinal: function(oEvent) {
            if (oEvent.getParameter("selected")) {
                this.mNewConfirmation.setProperty("/AUERU", "X");
            } else {
                this.mNewConfirmation.setProperty("/AUERU", " ");
            }
        },

        onCancelNewConfirmation: function(oEvent) {
            this.mConfirmationState.setProperty("/editing", false);
        },

        onSaveConfirmation: function(oEvent) {
            var promise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            $.ajax({
                url: "/ws_restful_data_controller/operation_confirmation",
                method: "POST",
                data: this.mNewConfirmation.getJSON()
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.mConfirmationState.setProperty("/editing", false);
                    self.loadConfirmations(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.AddConfirmationSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        onCancelFinal: function(oEvent) {
            var self = this;
            var oCheckbox = oEvent.getSource();
            jQuery.sap.require("sap.m.MessageBox");
            if (!oEvent.getParameter("selected")) {
                sap.m.MessageBox.show(this.getText("Final.cancel"), {
                    title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                    icon: sap.m.MessageBox.Icon.WARNING,
                    actions: [
                        sap.m.MessageBox.Action.OK,
                        sap.m.MessageBox.Action.CANCEL
                    ],
                    onClose: function(sAction) {
                        if (sAction === "OK") {
                            self.cancelFinal();
                        } else {
                            oCheckbox.setSelected(true);
                        }
                    }
                });
            }
        },

        cancelFinal: function() {
            var sQuery = Utilities.getQueryString({
                AUFNR: this.sAUFNR,
                VORNR: this.sVORNR
            });
            var sURL = "/ws_restful_data_controller/operation_confirmation" + sQuery;

            var promise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            $.ajax({
                url: sURL,
                method: "PUT"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.loadConfirmations(self.sAUFNR, self.sVORNR).always(promise.resolve);
                    sap.m.MessageToast.show(self.getText("ToastMessage.CancelConfirmationSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        allowNewConfirmation: function(aConfirmations) {
            for (var i = aConfirmations.length - 1; i >= 0; i--) {
                if (aConfirmations[i].AUERU === "X") {
                    return false;
                }
            }
            return true;
        },

        acquireLock: function(oEvent) {
            var sQuery = Utilities.getQueryString({
                OBJ_KEY: this.sAUFNR
            });

            var self = this;
            var oPromise = Utilities.showBusyIndicator($.Deferred());

            $.ajax({
                url: "/ws_restful_lock_controller/workorder" + sQuery,
                method: "POST"
            }).done(function(oResponseData) {
                oResponseData = oResponseData[0];

                if (oResponseData.LOCK_MESSAGE === "OK") {
                    oPromise.resolve();
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.Locked", [ oResponseData.LOCKED_BY_USER ]));
                    oPromise.reject();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                oPromise.reject();
            });

            return oPromise;
        },

        releaseLock: function(oEvent) {
            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_lock_controller/workorder",
                method: "DELETE"
            }));
        },

        categoryFormatter: function(sPOSTP) {
            if (typeof(sPOSTP) === "undefined") {
                return "";
            }
            var sKey = "Components.POSTP." + sPOSTP;
            var sResult = this.getText(sKey);
            if (sKey === sResult) {
                // Missing translation, just return POSTP
                return sPOSTP;
            }
            return sResult;
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
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBindingContext("components") || oSource.getBindingContext("confirmations");
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        },
        
        getFilterItems: function() {
            return [
                { key: "MATNR", label: "{i18nGlobal>General.component}" },
                { key: "POSNR", label: "{i18nGlobal>General.item}" },
                { key: "MAKTX", label: "{i18nGlobal>General.description}" },
                { key: "CATEGORY", label: "{i18n>Components.category}" },
                { key: "ISSUED", label: "{i18n>Components.issued}", type: Filter.InputType.Boolean, fnTest: this.isComponentIssued },
            ];
        },
        
        isComponentIssued: function(oComponent) {
            return oComponent.BDMNG === oComponent.ENMNG;
        },
        
        onFilter: function(oEvent) {
            Filter.filterList(this.oComponentsList);
        },
        
        onClearFilter: function(oEvent) {
            Filter.clearFilters(this.oComponentsList);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter, dep.fiori.lib.util.SelectMaterialDialog, dep.fiori.lib.util.SelectFromBOMDialog, dep.fiori.lib.util.SelectGenericDialog));