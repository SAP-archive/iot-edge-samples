jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Filter, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.extenderconfig.block.setup", {
        onInit: function() {
            this.setBlockId("setup");

            this.mSetup = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSetup, "setup");
            
            Filter.setFilterModels(this.getView(), this.getFilterItems());

            this.oTable = this.byId("list");
        },

        loadData: function() {

        },

        onListItemSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");
            var oDataProvider = oContext.getModel().getProperty(oContext.getPath());

            this.getView().getModel("router").getData().navTo("setup", {
                DATA_PROVIDER: oDataProvider.ID
            });
        },

        onDialogClose: function(oEvent) {
            this.oTable.getBinding('items').refresh();
            this.getEditDialog().getModel().setData({});
        },

        onCreate: function(oEvent) {
            var oDialog = this.getDialog();
            oDialog.getModel().setData({});
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        getDialog: function(oEvent) {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.block.setupProviderCreate", this);
                this.getView().addDependent(this.oDialog);
                this.oDialog.setModel(new sap.ui.model.json.JSONModel());
            }
            return this.oDialog;
        },

        onSaveProvider: function(oEvent) {
            var oDialog = this.getDialog();
            var oDataProvider = oDialog.getModel().getData();
            this.saveProvider(oDataProvider);
        },

        saveProvider: function(oDataProvider) {
            var oRequestData = {
                ID: oDataProvider.ID,
                DOMAIN_URL: oDataProvider.DOMAIN_URL,
                HTTP_PROXY: oDataProvider.HTTP_PROXY || '',
                CERTIFICATE: oDataProvider.CERTIFICATE || ''
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: '/ws_req_fwd_restful/dataprovider',
                method: 'POST',
                data: JSON.stringify(oRequestData)
            }).done(function(aResponseData) {
                if (aResponseData.length && aResponseData[0].ErrorMsg) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.Error", [ aResponseData[0].ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.ProviderSaveSuccess"));
                    self.closeDialog();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        closeDialog: function(oEvent) {
            var oDialog = this.getDialog();
            if (oDialog.isOpen()) {
                oDialog.close();
            }
        },

        onSortPress: function(oEvent) {
            if (!this.oSortDialog) {
                this.oSortDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.block.setupSort", this);
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
                { key: "ID", label: "{i18n>Label.providerId}" },
                { key: "DOMAIN_URL", label: "{i18n>Label.domain}" }
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