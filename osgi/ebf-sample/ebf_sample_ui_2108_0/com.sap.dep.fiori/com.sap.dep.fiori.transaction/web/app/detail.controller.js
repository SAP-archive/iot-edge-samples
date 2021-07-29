jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.transaction.app.detail", {
        onInit: function() {
            this.setKey("TRANSID");
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            this.mTransaction = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mTransaction);

            this.mDetail = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDetail, "detail");

            this.mSelected = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSelected, "selected");

            this.mObject = new sap.ui.model.json.JSONModel();
            this.mObject.setData(null)
            this.getView().setModel(this.mObject, "object");

            this.mObjectProperties = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mObjectProperties, "objectProps");

            this.oTable = this.getView().byId("objectList");
        },

        loadData: function(sTRANSID) {
            this.mSelected.setData(null);
            this.mObject.setData(null);
            this.mObjectProperties.setData([]);
            return $.when(
                this.loadTransaction(sTRANSID),
                this.loadTransactionDetail(sTRANSID)
            );
        },

        loadTransaction: function(sTRANSID) {
            this.mTransaction.setData({});
            var sUrl = "/ws_restful_data_controller/transaction_edge_error?TRANSID=" + sTRANSID;
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sUrl).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mTransaction.setData(oResponseData);
            }));
        },

        loadTransactionDetail: function(sTRANSID) {
            this.mDetail.setData({});
            var sUrl = "/ws_restful_data_controller/transaction_edge_error_content?TRANSID=" + sTRANSID;
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sUrl).done(function(aResponseData) {
                self.mDetail.setData(aResponseData);
            }));
        },

        onSelectObjectType: function(oEvent) {
            var oListItem = oEvent.getParameter("selectedItem");
            var oBinding = oListItem.getBindingContext("detail");
            this.mSelected.setData(oBinding.getModel().getProperty(oBinding.getPath()));
            this.oTable.bindAggregation("items", {
                path: "detail>" + oBinding.getPath() + "/RECORDS",
                template: this.getColumnListItem(this.mSelected.getProperty("/METADATA"))
            });
        },

        getColumnListItem: function(aMetadata) {
            var aCells = [];

            for (var i = 0; i < aMetadata.length; i++) {
                aCells.push(new sap.m.Label({
                    text: "{detail>" + aMetadata[i].PROP + "}"
                }));
            }

            return new sap.m.ColumnListItem({
                type: sap.m.ListType.Navigation,
                cells: aCells
            });
        },

        toObject: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oBinding = oListItem.getBindingContext("detail");
            var oObject = oBinding.getModel().getProperty(oBinding.getPath());

            var aObject = [];
            var aMetadata = this.mSelected.getProperty("/METADATA");
            for (var i = 0; i < aMetadata.length; i++) {
                aObject.push({
                    IS_KEY: aMetadata[i].IS_KEY,
                    PROP: aMetadata[i].PROP,
                    LABEL: aMetadata[i].LABEL,
                    VALUE: oObject[aMetadata[i].PROP]
                });
            }

            // aObject.sort(function(a, b) {
            //     if (a.IS_KEY === "Y" && b.IS_KEY !== "Y") {
            //         return -1;
            //     }
            //     return a.LABEL.localeCompare(b.LABEL);
            // });

            this.mObject.setData(oObject);
            this.mObjectProperties.setData(aObject);
        },

        toOverview: function() {
            this.mObject.setData(null)
        },

        currentObjectFormatter: function(sObjectType, aMetadata, oObject) {
            var sText = sObjectType;
            if (aMetadata && aMetadata.length && oObject) {
                var aKeys = aMetadata.filter(function(oItem) {
                    return oItem.IS_KEY === 'Y';
                });
                var aParts = [];
                for (var i = 0; i < aKeys.length; i++) {
                    aParts.push(oObject[aKeys[i].PROP]);
                }
                sText += " (" + aParts.join(", ") + ")";
            }
            return sText;
        },

        onDismiss: function(oEvent) {
            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(this.getText("Dialog.dismissMessage"), {
                title: this.getText("Dialog.confirmDismiss"),
                icon: sap.m.MessageBox.Icon.WARNING,
                actions: [
                    sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        self.dismissError();
                    }
                }
            });
        },

        dismissError: function() {
            var sTRANSID = this.mTransaction.getProperty("/TRANSID");
            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/transaction_edge_error?TRANSID=" + sTRANSID,
                method: "DELETE"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("Error.other", [ oResponseData.ErrorMsg ]));
                } else {
                    self.mTransaction.setData({});
                    self.getRouter().navTo("display", {}, true);
                }
            }));
        },

        transIdToDateFormatter: function(sTransId) {
            if (!sTransId) {
                return "";
            }
            var sDate = sTransId.substr(0, 4) + "-" + sTransId.substr(4, 2) + "-" + sTransId.substr(6, 2) + " " +
                sTransId.substr(8, 2) + ":" + sTransId.substr(10, 2) + ":" + sTransId.substr(12, 2);
            var oDate = new Date(sDate);
            this.oFormatter = this.oFormatter || sap.ui.core.format.DateFormat.getDateTimeInstance();
            return this.oFormatter.format(oDate);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));