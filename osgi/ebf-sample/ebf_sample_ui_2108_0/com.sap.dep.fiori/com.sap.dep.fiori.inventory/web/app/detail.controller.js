jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities, DataAccess) {
    DetailControllerBase.extend("dep.fiori.inventory.app.detail", {
        onInit: function() {
            this.setKey([ "INV_NO_LOCAL", "LGORT", "GJAHR" ]);
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            // Keep track of the primary key for the current document
            this.oIdentifier = {};

            this.mCount = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mCount);

            this.mReview = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mReview, "review");

            this.mLock = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mLock, "lock");

            this.mReasons = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mReasons, "reason");

            this.mAppovedBy = new sap.ui.model.json.JSONModel({
                approved: false
            });
            this.getView().setModel(this.mAppovedBy, "approvedBy");

            var self = this;
            $.ajax("/ws_restful_data_controller/physical_inventory_difference_reasons").done(function(aResponseData) {
                var gt = [];
                var lt = [];
                for (var i = 0; i < aResponseData.length; i++) {
                    if (aResponseData[i].BWART === '701') {
                        gt.push(aResponseData[i]);
                    } else if (aResponseData[i].BWART === '702') {
                        lt.push(aResponseData[i]);
                    }
                }
                self.mReasons.setData({
                    gt: gt,
                    lt: lt
                });
            });
        },
        
        loadData: function(oKey) {
            this.mCount.setData([]);
            this.mReview.setData([]);
            this.mAppovedBy.setProperty("/approved", false);

            this.oIdentifier = oKey;
            this.releaseLock();

            this.loadCount();
            this.loadReview();
        },

        refreshCount: function(oEvent) {
            Utilities.showBusyIndicator(this.loadCount());
        },

        loadCount: function() {
            var sQuery = Utilities.getQueryString(this.oIdentifier);
            var self = this;
            return $.ajax("/ws_restful_data_controller/physical_inventory_documents" + sQuery).done(function(aResponseData) {
                self.mCount.setData(aResponseData);
                if (aResponseData[0].XDIFF === "X") {
                    var sPath = "/Physical_Inventory_Documents(INV_NO_LOCAL='" + self.oIdentifier.INV_NO_LOCAL + "',LGORT='" + self.oIdentifier.LGORT + "')";
                    DataAccess.getODataModel("/dep/odata").read(sPath, {
                        success: function(oResponseData) {
                            self.mAppovedBy.setProperty("/approved", true);
                            self.mAppovedBy.setProperty("/plantuser", oResponseData.USNAM);
                        }
                    });
                } else {
                    self.mAppovedBy.setProperty("/approved", false);
                }
            });
        },

        refreshReview: function(oEvent) {
            Utilities.showBusyIndicator(this.loadReview());
        },

        loadReview: function() {
            var sQuery = Utilities.getQueryString({
                INV_NO_LOCAL: this.oIdentifier.INV_NO_LOCAL,
                GJAHR: this.oIdentifier.GJAHR
            });
            var self = this;
            return $.ajax("/ws_restful_data_controller/physical_inventory_reviews" + sQuery).done(function(aResponseData) {
                self.mReview.setData(aResponseData);
            });
        },

        acquireLock: function() {
            var self = this;
            var sINV_NO_LOCAL = this.mCount.getProperty("/0/INV_NO_LOCAL");
            
            Utilities.showBusyIndicator(
                Utilities.acquireLock("pinventory", sINV_NO_LOCAL).done(function() {
                    self.mLock.setProperty("/hasLock", true);
                }).fail(function(oResponseData) {
                    var sMessage;
                    if (oResponseData) {
                        sMessage = self.getText("ToastMessage.Locked", [ oResponseData.LOCKED_BY_USER ]);
                    } else {
                        sMessage = self.getText("ToastMessage.CommunicationError");
                    }
                    sap.m.MessageToast.show(sMessage);
                })
            );
        },

        releaseLock: function() {
            var self = this;
            Utilities.showBusyIndicator(
                Utilities.releaseLock("pinventory").done(function(oResponseData) {
                    self.mLock.setProperty("/hasLock", false);
                })
            );
        },

        onCountChange: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext().getPath();
            this.mCount.setProperty(sPath + "/ERFMG", oEvent.getParameter("newValue"));
            this.mCount.setProperty(sPath + "/IS_CHANGED", "U");
        },

        onSaveCount: function(oEvent) {
            var aItems = this.mCount.getData();
            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].IS_CHANGED) {
                    aItems[i].XZAEL = "X";
                }
            }

            var oRequestBody = {
                INV_NO_LOCAL: this.oIdentifier.INV_NO_LOCAL,
                LGORT: this.oIdentifier.LGORT,
                GJAHR: this.oIdentifier.GJAHR,
                BLDAT: Utilities.date.currDateFormatted(),
                PIDocItemArray: aItems
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/physical_inventory_documents",
                method: "PUT",
                data: JSON.stringify(oRequestBody)
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.releaseLock();
                    self.loadCount();
                    self.loadReview();
                    sap.m.MessageToast.show(self.getText("ToastMessage.SaveCountSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onSelectReason: function(oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var sPath = oEvent.getSource().getBindingContext("review").getPath();
            this.mReview.setProperty(sPath + "/REASON", sKey);
        },

        onSaveReview: function(oEvent) {
            var aItems = this.mReview.getData();
            var oRequestBody = {
                INV_NO_LOCAL: this.oIdentifier.INV_NO_LOCAL,
                LGORT: this.oIdentifier.LGORT,
                GJAHR: this.oIdentifier.GJAHR,
                BLDAT: Utilities.date.currDateFormatted(),
                PIDocItemArray: aItems
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/physical_inventory_reviews",
                method: "PUT",
                data: JSON.stringify(oRequestBody)
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.getPageLayout().setSelectedSection(self.getView().createId("detail"));
                    self.releaseLock();
                    self.loadCount();
                    sap.m.MessageToast.show(self.getText("ToastMessage.SaveReviewSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onPageNav: function(oEvent) {
            var sTab = oEvent.getParameter("section").getId().split("--").pop();
            this.releaseLock();
            if (sTab === "detail") {
                Utilities.showBusyIndicator(this.loadCount());
            } else if (sTab === "review") {
                Utilities.showBusyIndicator(this.loadReview());
            }
        },

        showStartCountFormatter: function(bHasLock) {
            if (bHasLock ||
                this.allItemsReviewed()) {
                return false;
            }
            return true;
        },

        showReviewTabFormatter: function(iReviewCount) {
            if (this.allItemsCounted() &&
                iReviewCount > 0 &&
                !this.allItemsReviewed()) {
                return true;
            }
            return false;
        },

        allItemsCounted: function() {
            var aItems = this.mCount.getData();
            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].XZAEL !== "X") {
                    return false;
                }
            }
            return true;
        },

        allItemsReviewed: function() {
            var aItems = this.mCount.getData();
            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].XDIFF !== "X") {
                    return false;
                }
            }
            return true;
        },

        toList: function(oEvent) {
            this.getRouter().navTo("list");
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBindingContext() || oSource.getBindingContext("review");
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));