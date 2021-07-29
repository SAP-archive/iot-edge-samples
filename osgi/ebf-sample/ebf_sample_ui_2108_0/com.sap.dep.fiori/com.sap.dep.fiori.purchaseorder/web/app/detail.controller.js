jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.purchaseorder.app.detail", {
        onInit: function() {
            this.setKey("EBELN");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mOrder = new sap.ui.model.json.JSONModel({});
            this.mOrder.setData("");
            this.getView().setModel(this.mOrder);

            this.mMaterials = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mMaterials, "materials");

            this.mService = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mService, "service");

            this.mStorageLocation = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mStorageLocation, "selectedLocation");

            var self = this;
            $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
            
            this.mUIProps = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mUIProps, "uiProps");
        },
        
        loadData: function(sEBELN) {
            this.mOrder.setData(sEBELN);
            this.loadOrder();
        },

        loadOrder: function() {
            var self = this;
            Utilities.showBusyIndicator($.when(this.loadMaterials(), this.loadServiceEntry())).done(function() {
                if (self.mMaterials.getData().length < 1 && self.mService.getData().length > 0) {
                    self.getPageLayout().setSelectedSection(self.getView().createId("service"));
                }
            });
        },

        refreshMaterials: function(oEvent) {
            Utilities.showBusyIndicator(this.loadMaterials());
        },

        loadMaterials: function() {
            this.mMaterials.setData([]);
            var sQuery = Utilities.getQueryString({
                EBELN: this.mOrder.getData()
            });

            var sURL = "/ws_restful_data_controller/purchase_orders" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                for (var i = 0; i < aResponseData.length; i++) {
                    aResponseData[i].ERFME = aResponseData[i].MEINS;
                    aResponseData[i].ERFMG_101 = "";
                    aResponseData[i].ERFMG_343 = "";
                    aResponseData[i].LGORT = self.mStorageLocation.getProperty("/LGORT");
                }

                self.mMaterials.setData(aResponseData);
            });
        },

        refreshService: function(oEvent) {
            Utilities.showBusyIndicator(this.loadServiceEntry());
        },

        loadServiceEntry: function() {
            this.mService.setData([]);
            var sQuery = Utilities.getQueryString({
                PO_NUM: this.mOrder.getData()
            });

            var sURL = "/ws_restful_data_controller/service_entry_sheets" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                self.mService.setData(aResponseData);
            });
        },

        onChange: function(oEvent) {
            var oListItem = oEvent.getSource();
            var oContext = oListItem.getBindingContext("materials");
            var oItem = oContext.getObject();

            oItem.IS_CHANGED = "U";
        },

        saveReceipt: function() {
            var aItems = this.mMaterials.getData();
            var aRequestItems = [];

            for (var i = 0; i < aItems.length; i++) {
                // Make sure request items have the same properties, serialized in the same order
                if (aItems[i].IS_CHANGED !== "") {
                    aItems[i].ERFME = aItems[i].MEINS;
                    aItems[i].CHARG = aItems[i].BWTAR;
                    aItems[i].ERFMG_101 = aItems[i].ERFMG_101 || "";
                    aItems[i].ERFMG_343 = aItems[i].ERFMG_343 || "";
                    aItems[i].LGORT = this.mStorageLocation.getProperty("/LGORT");

                    aItems[i].PO_OPEN_QTY = Number(aItems[i].PO_OPEN_QTY) - Number(aItems[i].ERFMG);

                    if (aItems[i].ERFMG_101 !== "") {
                        aItems[i].BWART = "101";
                        aItems[i].ERFMG = aItems[i].ERFMG_101;
                        aItems[i].KZBEW = "B";
                    } else if (aItems[i].ERFMG_343 !== "") {
                        aItems[i].BWART = "343";
                        aItems[i].ERFMG = aItems[i].ERFMG_343;
                        aItems[i].KZBEW = "";
                        aItems[i].INSMK = 1; //Stock Type
                        aItems[i].UMLGO = aItems[i].LGORT;
                        aItems[i].XBLNR = aItems[i].EBELN;
                    }

                    aRequestItems.push(aItems[i]);
                }
            }
            
            var sBudat = Utilities.date.currDateFormatted();
            // Special case for testing
            if (this.mUIProps.getProperty("/adjustBudat")) {
                sBudat = "20190601";
            }

            var oRequestBody = {
                //BKTXT: "",
                MJAHR: new Date().getFullYear(),
                BLDAT: Utilities.date.currDateFormatted(),
                BUDAT: sBudat,
                //GTS_CUSREF_NO: "",
                //XBLNR: "",
                GoodsReceiptArr: aRequestItems
            };

            var sURL = "/ws_restful_data_controller/purchase_order_goods_receipts";
            var oPromise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            $.ajax({
                url: sURL,
                method: "POST",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    oPromise.reject();
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.SaveSuccess"));
                    self.loadMaterials().always(function() {
                        oPromise.resolve();
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                oPromise.reject();
            });

            return oPromise;
        },

        onSheetSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("service");

            var oItem = oContext.getModel().getProperty(oContext.getPath());
            this.getRouter().navTo("service", {
                PO_NUMBER: oItem.PO_NUMBER,
                SHEET_NO_LOCAL: oItem.SHEET_NO_LOCAL
            });
        },

        approvalFormatter: function(val) {
            if (val === "05") {
                return this.getText("Approval.approved");
            } else if (val === "02") {
                return this.getText("Approval.notRequired");
            } else {
                return this.getText("Approval.notApproved");
            }
        },

        receive101Formatter: function(oItem) {
            if (oItem.PSTYP === "9" ||
                oItem.SPERR === "X" ||
                oItem.BACKORDER_QTY <= 0 ||
                oItem.AVAIL_QTY_101 <= 0) {
                return false;
            }

            if (oItem.PSTYP === "0") {
                if (oItem.MATNR.trim() === "") {
                    // Text item can be received if:
                    // It is account assigned (KNTTP = 'F' OR 'K' in O_PO_ITM)
                    // It is flagged as requiring a goods receipt (EKPO-WEPOS is checked)
                    if ((oItem.KNTTP === "K" ||
                        oItem.KNTTP === "F") &&
                        oItem.WEPOS === "X") {
                        return true;
                    }
                    return false;
                } else if (oItem.KNTTP === "K" || oItem.KNTTP === "F") {
                    // We can't receive goods if the material is account assigned i.e. KNTTP is equal to 'K' or 'F'
                    return false;
                }
            }
            return true;
        },

        receive343Formatter: function(oItem) {
            if (oItem.SPERR === "X" ||
                oItem.AVAIL_QTY <= 0 ||
                oItem.KNTTP === "K" ||
                oItem.KNTTP === "F") {
                return false;
            }
            return true;
        },

        errorStateFormatter: function(sMax) {
            return this.getText("Error.exceedsQty", [ sMax ]);
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            console.log(oSource)
            var oBinding = oSource.getBindingContext("materials");
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));