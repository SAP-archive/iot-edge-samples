(function(Utilities, DataAccess) {
    sap.ui.controller("dep.fiori.wonotification.app.list", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");

            this.mFilter = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mFilter, "filter");

            this.oTable = this.getView().byId("list");
            var oSorter = new sap.ui.model.Sorter("AUFNR", true);
            var oBinding = this.oTable.getBinding("items");
            oBinding.sort(oSorter);
        },

        onCreate: function(oEvent) {
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "#depNotification-display&/create"
                }
            });
        },

        onListItemSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");

            var oWorkorder = oContext.getModel().getProperty(oContext.getPath());
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "#depNotification-display&/" + oWorkorder.AUFNR
                }
            });
            
        },

        onFilter: function(oEvent) {
            var oCriteria = this.mFilter.getData();

            var aFilters = [];
            for (var sKey in oCriteria) {
                if (oCriteria.hasOwnProperty(sKey) && oCriteria[sKey]) {
                    var sCriteria = oCriteria[sKey];
                    aFilters.push(
                        new sap.ui.model.Filter(
                            sKey,
                            sap.ui.model.FilterOperator.Contains,
                            sCriteria
                        )
                    );
                }
            }

            var oBinding = this.oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        onClearFilter: function(oEvent) {
            this.mFilter.setData({});
            this.onFilter(oEvent);
        },

        onSortPress: function(oEvent) {
            if (!this.oSortDialog) {
                this.oSortDialog = sap.ui.xmlfragment("dep.fiori.wonotification.app.listSort", this);
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

        getText: function(sKey, aArgs) {
            this.oI18n = this.oI18n || this.getView().getModel("i18n").getResourceBundle();
            if (this.oI18n) {
                return this.oI18n.getText(sKey, aArgs);
            }
            return "";
        }
    });
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));