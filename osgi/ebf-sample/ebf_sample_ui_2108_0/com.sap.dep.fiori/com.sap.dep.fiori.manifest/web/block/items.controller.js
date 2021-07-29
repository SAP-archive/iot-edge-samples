jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.manifest.block.items", {
        onInit: function() {
            this.setKey("MANIFEST_ID");
            this.setBlockId("containerItems");

            this.mManifestItems = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mManifestItems, "manifestItems");

            this.mStorageLocation = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mStorageLocation, "selectedLocation");

            this.oHierarchyTable = this.byId("hierarchyTable");

            var self = this;
            $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
        },

        loadData: function(sManifestId) {
            this.loadItems(sManifestId);
        },

        loadItems: function(sManifestId) {
            this.mManifestItems.setData([]);
            var self = this;
            var sURL = "/ws_restful_data_controller/manifest_items?MANIFEST_ID=" + sManifestId;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                self.mManifestItems.setData(oResponseData);
               // self.selectPOInHierarchy(oResponseData, sManifestId);
            }));
        },

        typeFormatter: function(sPOTYP) {
            var sText = this.getText("Type." + sPOTYP);
            if (sText === "Type." + sPOTYP) {
                return sPOTYP;
            }
            return sText || sPOTYP;
        },

        selectPOInHierarchy: function(oHierarchyData, sManifestId) {
            // Find first path in the hierarchy
            var aPath = this.getHierarchyPath(oHierarchyData.POItemArray, sManifestId, []);
            // Expand all nodes in the path
            this.oHierarchyTable.collapseAll();
            var iCount = 0;
            for (var i = 0; i < aPath.length; i++) {
                iCount += aPath[i];
                this.oHierarchyTable.expand(iCount + i);
            }
            var iIndex = iCount + aPath.length - 1;
            this.oHierarchyTable.setSelectedIndex(iIndex);
            if (iIndex < this.oHierarchyTable.getFirstVisibleRow() ||
                    iIndex > this.oHierarchyTable.getFirstVisibleRow() + this.oHierarchyTable.getVisibleRowCount() - 1) {
                this.oHierarchyTable.setFirstVisibleRow(iIndex);
            }
        },

        getHierarchyPath: function(aData, sManifestId, aCurrPath) {
            for (var i = 0; i < aData.length; i++) {
                var aPath = aCurrPath.concat(i);
                if (aData[i].MANIFEST_ID === sManifestId) {
                    return aPath;
                }
                if (aData[i].POItemArray) {
                    sResult = this.getHierarchyPath(aData[i].POItemArray, sManifestId, aPath);
                    if (sResult !== null) {
                        return sResult;
                    }
                }
            }
            return null;
        },

        onCollapseAll: function() {
            this.oHierarchyTable.collapseAll();
        },

        onReceive: function(oEvent) {
            var aSelectedIndices = this.oHierarchyTable.getSelectedIndices();
            var oModel = this.oHierarchyTable.getBinding("rows").getModel();

            if (aSelectedIndices.length === 0) {
                sap.m.MessageToast.show("Select at least one row first.");
                return;
            } else {
                this.saveReceipt(); // Receive the changed data
            }
        },

        onReceive: function(oEvent) {
            var aPurchaseOrders = this.mManifestItems.getData();
            var aChangedPOs = [];
            var aPromises = [];

            for (var i = 0; i < aPurchaseOrders.length; i++) {
                var bItemChanged = false;
                for (var n = 0; n < aPurchaseOrders[i].ITEMS.length; n++) {
                    if (aPurchaseOrders[i].ITEMS[n].IS_CHANGED === "U"){
                        bItemChanged = true;
                        break;
                    }
                }
                if (bItemChanged) {
                    aChangedPOs.push(aPurchaseOrders[i]);
                    //aPromises.push(this.saveReceipt(aPurchaseOrders[i].ITEMS));
                }
            }

            this.saveReceipts(aChangedPOs);
        },

        saveReceipts: function(aPurchaseOrders, aResults, i) {
            aResults = aResults || [];
            i = i || 0;

            var self = this;
            this.saveReceipt(aPurchaseOrders[i].ITEMS).always(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                aResults.push(oResponseData);
                i++;
                if (i === aPurchaseOrders.length) {
                    self.showSaveDialog(aPurchaseOrders, aResults);
                } else {
                    self.saveReceipts(aPurchaseOrders, aResults, i);
                }
            });
        },

        saveReceipt: function(aItems) {
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

            var oRequestBody = {
                //BKTXT: "",
                MJAHR: new Date().getFullYear(),
                BLDAT: Utilities.date.currDateFormatted(),
                BUDAT: Utilities.date.currDateFormatted(),
                GM_CODE: "01",
                //GTS_CUSREF_NO: "",
                //XBLNR: "",
                GoodsReceiptArr: aRequestItems
            };

            var sURL = "/ws_restful_data_controller/purchase_order_goods_receipts";
            var oPromise = $.Deferred();

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
                    oPromise.reject(oResponseData);
                } else {
                    oPromise.resolve(oResponseData);
                }
            }).fail(function() {
                oPromise.reject();
            });

            return oPromise;
        },

        showSaveDialog: function(aPurchaseOrders, aResults) {
            var oDialog = this.getSaveDialog();
            var aDisplay = [];
            for (var i = 0; i < aPurchaseOrders.length; i++) {
                aDisplay.push({
                    EBELN: aPurchaseOrders[i].EBELN,
                    ERROR: aResults[i].ErrorMsg
                });
            }
            console.log(aDisplay)
            oDialog.getModel().setData(aDisplay);
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        getSaveDialog: function(oEvent) {
            if (!this.oSaveDialog) {
                this.oSaveDialog = sap.ui.xmlfragment("dep.fiori.manifest.app.receiveSummary", this);
                this.getView().addDependent(this.oSaveDialog);
                this.oSaveDialog.setModel(new sap.ui.model.json.JSONModel([]));
            }
            return this.oSaveDialog;
        },

        closeDialog: function(oEvent) {
            var oDialog = this.getSaveDialog();
            if (oDialog.isOpen()) {
                oDialog.close();
            }
        },

        onDialogClose: function(oEvent) {
            this.getSaveDialog().getModel().setData([]);
            this.loadItems(this.getKeyValue());
        },

        onChange: function(oEvent) {
            var oListItem = oEvent.getSource();
            var oContext = oListItem.getBindingContext("manifestItems");
            var oItem = oContext.getModel().getProperty(oContext.getPath());

            oItem.IS_CHANGED = "U";
        },

        receive101Formatter: function(oItem) {
            if (!oItem) {
                return false;
            }

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
            if (!oItem) {
                return false;
            }

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
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities));