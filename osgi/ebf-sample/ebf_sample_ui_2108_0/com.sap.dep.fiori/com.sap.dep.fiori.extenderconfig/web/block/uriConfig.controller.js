jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Filter, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.extenderconfig.block.uriConfig", {
        onInit: function() {
            this.setBlockId("uriConfig");

            this.mConfig = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mConfig, "uriConfig");

            this.mServices = new sap.ui.model.json.JSONModel("/ws_req_fwd_restful/dataservice");
            this.getView().setModel(this.mServices, "services");

            Filter.setFilterModels(this.getView(), this.getFilterItems());

            this.oTable = this.byId("list");
        },

        loadData: function() {
            
        },

        onListItemSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");
            var oConfig = oContext.getModel().getProperty(oContext.getPath());

            var oDialog = this.getEditDialog();
            oDialog.getModel().setData(oConfig);
            oDialog.getModel("mode").setData("edit");
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        onCreate: function(oEvent) {
            var oDialog = this.getEditDialog();
            oDialog.getModel().setData({
                URI: "",
                URI_IS_PREFIX: "false"
            });

            oDialog.getModel("mode").setData("create");
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        getEditDialog: function(oEvent) {
            if (!this.oEditDialog) {
                this.oEditDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.block.uriConfigEdit", this);
                this.getView().addDependent(this.oEditDialog);
                this.oEditDialog.setModel(new sap.ui.model.json.JSONModel());
                this.oEditDialog.setModel(new sap.ui.model.json.JSONModel(), "mode");
            }
            return this.oEditDialog;
        },

        onEditDialogClose: function(oEvent) {
            this.oTable.getBinding('items').refresh();
            this.getEditDialog().getModel().setData({});
        },

        closeEditDialog: function(oEvent) {
            var oDialog = this.getEditDialog();
            if (oDialog.isOpen()) {
                oDialog.close();
            }
        },

        onSaveConfig: function(oEvent) {
            var oDialog = this.getEditDialog();
            var oConfig = oDialog.getModel().getData();
            var sMode = oDialog.getModel("mode").getData();

            if (oConfig.URI_IS_PREFIX === "true") {
                oConfig.URI_IS_PREFIX = true;
            } else if (oConfig.URI_IS_PREFIX === "false") {
                oConfig.URI_IS_PREFIX = false;
            }

            if (sMode === "edit") {
                this.saveConfigPUT(oConfig);
            } else {
                this.saveConfigPOST(oConfig);
            }
        },

        saveConfigPUT: function(oConfig) {
            var iIsPrefix;
            if (oConfig.URI_IS_PREFIX === "true" || oConfig.URI_IS_PREFIX === true) {
                iIsPrefix = 1;
            } else {
                iIsPrefix = 0;
            }

            var oRequestBody = {
                SIGNATURE: oConfig.SIGNATURE,
                URI: oConfig.URI,
                URI_IS_PREFIX: iIsPrefix,
                IS_SHARED: oConfig.IS_SHARED || null,
                HAS_PERSONAL_DATA: oConfig.HAS_PERSONAL_DATA || null,
                OVERRIDE_FREQ: oConfig.OVERRIDE_FREQ || null
            };

            var self = this;
            return dep.fiori.lib.util.Utilities.showBusyIndicator(
                $.ajax({
                    url: "/ws_req_fwd_restful/config",
                    method: "PUT",
                    data: JSON.stringify(oRequestBody)
                }).done(function(aResponseData) {
                    if (aResponseData.length && aResponseData[0].ErrorMsg) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.Error", [ aResponseData[0].ErrorMsg ]));
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.SaveSuccess"));
                        self.closeEditDialog();
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                })
            );
        },

        saveConfigPOST: function(oConfig) {
            if (!oConfig.SIGNATURE) {
                sap.m.MessageToast.show(this.getText("ToastMessage.NoSignature"));
                return;
            }

            var iIsPrefix;
            if (oConfig.URI_IS_PREFIX === "true" || oConfig.URI_IS_PREFIX === true) {
                iIsPrefix = 1;
            } else {
                iIsPrefix = 0;
            }

            var oRequestBody = {
                SIGNATURE: oConfig.SIGNATURE,
                URI: oConfig.URI,
                URI_IS_PREFIX: iIsPrefix,
                IS_SHARED: oConfig.IS_SHARED || null,
                HAS_PERSONAL_DATA: oConfig.HAS_PERSONAL_DATA || null,
                OVERRIDE_FREQ: oConfig.OVERRIDE_FREQ || null
            };

            var self = this;
            return dep.fiori.lib.util.Utilities.showBusyIndicator(
                $.ajax({
                    url: "/ws_req_fwd_restful/config",
                    method: "POST",
                    data: JSON.stringify(oRequestBody)
                }).done(function(aResponseData) {
                    if (aResponseData.length && aResponseData[0].ErrorMsg) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.Error", [ aResponseData[0].ErrorMsg ]));
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.SaveSuccess"));
                        self.getEditDialog().getModel("mode").setData("edit");
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                })
            );
        },

        onDelete: function(oEvent) {
            var oDialog = this.getEditDialog();
            var oConfig = oDialog.getModel().getData();

            var iIsPrefix;
            if (oConfig.URI_IS_PREFIX === "true" || oConfig.URI_IS_PREFIX === true) {
                iIsPrefix = 1;
            } else {
                iIsPrefix = 0;
            }

            var sQuery = Utilities.getQueryString({
                SIGNATURE: oConfig.SIGNATURE,
                URI: oConfig.URI,
                URI_IS_PREFIX: iIsPrefix
            });

            var self = this;
            return dep.fiori.lib.util.Utilities.showBusyIndicator(
                $.ajax({
                    url: "/ws_req_fwd_restful/config" + sQuery,
                    method: "DELETE"
                }).done(function(aResponseData) {
                    if (aResponseData.length && aResponseData[0].ErrorMsg) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.Error", [ aResponseData[0].ErrorMsg ]));
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.DeleteSuccess"));
                        self.closeEditDialog();
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                })
            );
        },

        yesNoFormatter: function(bVal) {
            if (bVal === true || bVal === 'Y') {
                return Utilities.geti18nGlobal("General.yes");
            } else if (bVal === false || bVal === 'N') {
                return Utilities.geti18nGlobal("General.no");
            }
            return '';
        },

        onSortPress: function(oEvent) {
            if (!this.oSortDialog) {
                this.oSortDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.block.uriConfigSort", this);
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        },

        onSort: function(oEvent) {
            var sSortKey = oEvent.getParameter("sortItem").getKey();
            var bDescending = oEvent.getParameter("sortDescending");
            var oSorter = new sap.ui.model.Sorter(sSortKey, bDescending);

            var oBinding = this.oTable.getBinding("items");
            oBinding.sort(oSorter);
        },
        
        getFilterItems: function() {
            return [
                { key: "SIGNATURE", label: "{i18n>Label.signature}" },
                { key: "URI", label: "{i18n>Label.uri}" },
                { key: "URI_IS_PREFIX", label: "{i18n>Label.isPrefix}", type: Filter.InputType.Boolean,
                  compareValue: true, filterOperator: sap.ui.model.FilterOperator.EQ },
                { key: "IS_SHARED", label: "{i18n>Label.isShared}", type: Filter.InputType.Boolean,
                  compareValue: "Y", filterOperator: sap.ui.model.FilterOperator.EQ },
                { key: "HAS_PERSONAL_DATA", label: "{i18n>Label.hasPersonal}", type: Filter.InputType.Boolean,
                  compareValue: "Y", filterOperator: sap.ui.model.FilterOperator.EQ }
            ];
        },
        
        onFilter: function(oEvent) {
            Filter.filterList(this.oTable);
        },
        
        onClearFilter: function(oEvent) {
            Filter.clearFilters(this.oTable);
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));