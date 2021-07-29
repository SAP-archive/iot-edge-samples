jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function(Utilities, DataAccess) {
    sap.ui.controller("dep.fiori.report.app.display", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this.mArgs = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mArgs, "args");

            this.mReports = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mReports);

            this.mFilter = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mFilter, "filter");

            this.oTable = this.getView().byId("reportList");
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "display") {
                var oArgs = oEvent.getParameter("arguments");

                if (oArgs.TCODE !== this.mArgs.getProperty("/sTCODE") ||
                    oArgs.REPVAR !== this.mArgs.getProperty("/sREPVAR")) {
                    this.mArgs.setData({
                        sTCODE: oArgs.TCODE,
                        sREPVAR: oArgs.REPVAR
                    });
                    this.loadReports();
                }
            }
        },

        loadReports: function() {
            var sQuery = Utilities.getQueryString({
                TCODE: this.mArgs.getProperty("/sTCODE"),
                REPVAR: this.mArgs.getProperty("/sREPVAR")
            });

            var sURL = "/ws_restful_data_controller/reports" + sQuery;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mReports.setData(aResponseData);
            }));
        },

        onSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext();

            var oItem = oContext.getModel().getProperty(oContext.getPath());
            window.open("/reportsfetchpdf?FILENAME=" + oItem.FILENAME);
        },

        onFilter: function(oEvent) {
            var oCriteria = this.mFilter.getData();

            var aFilters = [];
            for (var sKey in oCriteria) {
                if (oCriteria.hasOwnProperty(sKey) && oCriteria[sKey]) {
                    aFilters.push(
                        new sap.ui.model.Filter(
                            sKey,
                            sap.ui.model.FilterOperator.Contains,
                            oCriteria[sKey]
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
                this.oSortDialog = sap.ui.xmlfragment("dep.fiori.report.app.displaySort", this);
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
        }
    });
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));