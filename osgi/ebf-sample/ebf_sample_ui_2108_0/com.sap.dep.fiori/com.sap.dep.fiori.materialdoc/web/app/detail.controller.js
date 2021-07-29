jQuery.sap.require("dep.fiori.materialdoc.app.Constants");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(Constants, ControllerBase, Utilities) {
    ControllerBase.extend("dep.fiori.materialdoc.app.detail", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this.mDocument = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDocument);

            this.mState = new sap.ui.model.json.JSONModel({
                editing: false
            });
            this.getView().setModel(this.mState, "state");
            
            this.mBWART = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mBWART, "BWART");
            
            this.mMovementTypes = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mMovementTypes, "movementTypes");
            
            Utilities.showBusyIndicator(this.loadMovementTypes());
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "detail") {
                this.mState.setProperty("/editing", false);
                var oNavArgs = oEvent.getParameter("arguments");
                if (this.sMBLNR !== oNavArgs.MBLNR) {
                    this.sMBLNR = oNavArgs.MBLNR;
                    this.mDocument.setData([]);
                    Utilities.showBusyIndicator(this.loadDocument(this.sMBLNR));
                }
            }
        },

        refresh: function(oEvent) {
            this.mDocument.setData([]);
            Utilities.showBusyIndicator(this.loadDocument(this.sMBLNR));
        },

        loadDocument: function(sMBLNR) {
            var self = this;
            return $.ajax("/ws_restful_data_controller/material_docs?MBLNR=" + sMBLNR).done(function(aResponseData) {
                if (aResponseData.length) {
                    for (var i = aResponseData.length - 1; i >= 0; i--) {
                        aResponseData[i].REVERSE = null;
                    }
                    self.mDocument.setData(aResponseData);
                    
                    if (aResponseData.length > 0) {
                        self.filterReverseMovementTypes(aResponseData[0].BWART);
                    }
                } else {
                    self.cancel();
                }
            }).fail(function() {
                self.cancel();
            });
        },

        cancel: function() {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            this.sMBLNR = null;
            this.mDocument.setData([]);
            if (sPreviousHash) {
                window.history.go(-1);
            } else {
                this.oRouter.navTo("list", {}, true);
            }
        },

        onTableEdit: function(oEvent) {
            this.mState.setProperty("/editing", true);
        },

        onTableCancel: function(oEvent) {
            this.mState.setProperty("/editing", false);
            var aItems = this.mDocument.getData();
            for (var i = aItems.length - 1; i >= 0; i--) {
                aItems[i].REVERSE = null;
            }
            this.mDocument.refresh();
        },

        onTableSave: function(oEvent) {
            var bValid = true;
            var aItems = this.mDocument.getData();
            for (var i = aItems.length - 1; i >= 0; i--) {
                if (aItems[i].REVERSE > aItems[i].REVERSIBLE_QTY) {
                    bValid = false;
                    break;
                }
            }

            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.reverseExceedsQty"));
            } else {
                var self = this;
                var oRequestBody = {
                    // BKTXT: "",
                    MJAHR: new Date().getFullYear(),
                    BLDAT: Utilities.date.currDateFormatted(),
                    BUDAT: Utilities.date.currDateFormatted(),
                    // GTS_CURSREF_NO: "",
                    // XBLNR: "",
                    MatDocItems: []
                };

                for (var i = aItems.length - 1; i >= 0; i--) {
                    if (aItems[i].ERFMG > 0) {
                        var oItem = Object.assign({}, aItems[i]);
                        oItem.BWART = this.mBWART.getData();
                        oItem.ERFMG = oItem.REVERSE;
                        delete oItem.REVERSE;
                        oRequestBody.MatDocItems.push(oItem);
                    }
                }

                Utilities.showBusyIndicator($.ajax({
                    url: "/ws_restful_data_controller/material_doc_reversal",
                    method: "POST",
                    data: JSON.stringify([ oRequestBody ])
                })).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }

                    if (oResponseData.ErrorID) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    } else {
                        self.mState.setProperty("/editing", false);
                        jQuery.sap.require("sap.m.MessageBox");
                        sap.m.MessageBox.show(self.getText("Dialog.success"), {
                            title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.success"),
                            icon: sap.m.MessageBox.Icon.SUCCESS,
                            actions: [
                                sap.m.MessageBox.Action.YES,
                                sap.m.MessageBox.Action.NO
                            ],
                            onClose: function(sAction) {
                                if (sAction === "YES") {
                                    self.oRouter.navTo("detail", {
                                        MBLNR: oResponseData.OBJECT_KEY
                                    });
                                } else {
                                    // On cancel, reload the current doc
                                    Utilities.showBusyIndicator(self.loadDocument(self.sMBLNR));
                                }
                            }
                        });
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                });
            }
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            console.log(oSource)
            var oBinding = oSource.getBindingContext();
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        },
        
        loadMovementTypes: function() {
            return $.ajax("/ws_restful_data_controller/movement_types").done(function(aResponseData) {
                this.mMovementTypes.setData(aResponseData);
            }.bind(this));
        },
        
        filterReverseMovementTypes: function(sBWART) {
            var aTypes = this.getReverseMovementTypes(sBWART);
            var aFilters = aTypes.map(function(sType) { return new sap.ui.model.Filter("BWART", sap.ui.model.FilterOperator.EQ, sType); });
            this.byId("reverseMvmtTypeSelect").getBinding("items").filter(aFilters);
        },
        
        getReverseMovementTypes: function(sBWART) {
            if (!this.oReverseMovementTypes) {
                this.oReverseMovementTypes = {};
                this.oReverseMovementTypes[Constants.MovementType.GOOD_RECEIPT_FOR_PO] = [ Constants.MovementType.GOOD_RECEIPT_FOR_PO_REVERSAL, Constants.MovementType.RETURN_TO_VENDOR ],
                this.oReverseMovementTypes[Constants.MovementType.GOOD_ISSUED_FOR_COST_CENTRE] = [ Constants.MovementType.GOOD_ISSUED_FOR_COST_CENTRE_REVERSAL ];
                this.oReverseMovementTypes[Constants.MovementType.GOOD_ISSUED_FOR_WORKORDER] = [ Constants.MovementType.GOOD_ISSUED_FOR_WORKORDER_REVERSAL ];
                this.oReverseMovementTypes[Constants.MovementType.TRANSFER_BLOCKED_TO_UNRESTRICTED] = [ Constants.MovementType.TRANSFER_BLOCKED_TO_UNRESTRICTED_REVERSAL ];
            }
            return this.oReverseMovementTypes[sBWART] || [];
        }
    });
}(dep.fiori.materialdoc.app.Constants, dep.fiori.lib.controller.ControllerBase, dep.fiori.lib.util.Utilities));