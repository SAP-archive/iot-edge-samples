jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Filter, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.extenderconfig.block.stats", {
        onInit: function() {
            this.setBlockId("Stats");

            this.mStats = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mStats, "Stats");
            
            Filter.setFilterModels(this.getView(), this.getFilterItems());

            this.oTable = this.byId("list");
        },

        loadData: function() {
        //	var self = this;
          //  return Utilities.showBusyIndicator($.ajax("/ws_req_fwd_odata/").done(function(oResponseData) {
            //    self.mEquipment.setData(oResponseData);
            //}));
        },

        odataDateFormatter: function(sDate) {
            if (sDate) {
                var oDate = new Date(Date(sDate));
                return Utilities.formatters.formatJSDateTime(oDate);
            }
            return '';
        },

        onSortPress: function(oEvent) {
            if (!this.oSortDialog) {
                this.oSortDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.block.statsSort", this);
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
                { key: "URI", label: "{i18n>Label.uri}" }
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