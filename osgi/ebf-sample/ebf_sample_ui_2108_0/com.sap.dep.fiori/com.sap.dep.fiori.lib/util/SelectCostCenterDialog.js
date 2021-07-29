jQuery.sap.setObject("dep.fiori.lib.util.SelectCostCenterDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function(SelectCostCenterDialog, Utilities, DataAccess) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oSortDialog = null;

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectCostCenterDialog, {
        getDialog: function(sEntityPath) {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectCostCenter", this);

                _oDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                _oDialog.setModel(new sap.ui.model.json.JSONModel({}), "filter");
            }

            return _oDialog;
        },

        getCostCenter: function(sEntityPath, oInitialFilters) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = SelectCostCenterDialog.getDialog(sEntityPath);
            if (!oDialog.isOpen()) {
                oDialog.open();
            }

            return _oPendingSelection;
        },

        onSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");

            var oCostCenter = oContext.getModel().getProperty(oContext.getPath());

            if (_oPendingSelection) {
                _oPendingSelection.resolve(oCostCenter);
            }

            SelectCostCenterDialog.close();
            oListItem.setSelected(false);
        },

        close: function() {
            var oDialog = SelectCostCenterDialog.getDialog();
            oDialog.close();
        },

        onCancel: function() {
            if (_oPendingSelection) {
                _oPendingSelection.reject();
            }
        },

        // It's awkward to get a control within a dialog, so use this formatter to get a reference to the table
        // The alternative is to use jQuery or give things IDs, this is much simpler
        setTableReference: function(sParam) {
            if (!_oTable) {
                _oTable = this;
            }
            return sParam;
        },

        onFilter: function(oEvent) {
            if (_oTable) {
                var oBinding = _oTable.getBinding("items");
                oBinding.filter(SelectCostCenterDialog.getFiltersFromModel());
            }
        },

        getFiltersFromModel: function() {
            var oDialog = SelectCostCenterDialog.getDialog();
            var oCriteria = oDialog.getModel("filter").getData();

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

            return aFilters;
        },

        onClearFilter: function(oEvent) {
            var oDialog = SelectCostCenterDialog.getDialog();
            oDialog.getModel("filter").setData({});
            SelectCostCenterDialog.onFilter(oEvent);
        },

        onSortPress: function(oEvent) {
            if (!_oSortDialog) {
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.SelectCostCenterSort", this);
                _oSortDialog.setModel(_oDialog.getModel("i18nGlobal"), "i18nGlobal");
            }
            _oSortDialog.open();
        },

        onSort: function(oEvent) {
            var sSortKey = oEvent.getParameter("sortItem").getKey();
            var bDescending = oEvent.getParameter("sortDescending");
            var oSorter = new sap.ui.model.Sorter(sSortKey, bDescending);

            if (_oTable) {
                var oBinding = _oTable.getBinding("items");
                oBinding.sort(oSorter);
            }
        }
    });
}(dep.fiori.lib.util.SelectCostCenterDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));