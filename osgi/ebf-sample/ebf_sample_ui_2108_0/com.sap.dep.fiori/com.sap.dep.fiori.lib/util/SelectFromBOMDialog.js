jQuery.sap.setObject("dep.fiori.lib.util.SelectFromBOMDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectFromBOMDialog, Utilities, DataAccess, Filter) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oSortDialog = null;
    
    var _aFilterItems = [
        { key: "IDNRK", label: "{i18nGlobal>MaterialSelect.material}" },
        { key: "STLKN", label: "{i18nGlobal>General.item}" },
        { key: "MAKTX", label: "{i18nGlobal>General.description}" }
    ];

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectFromBOMDialog, {
        getDialog: function() {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("bomDialog", "dep.fiori.lib.frag.selectFromBOM", this);
                _oTable = sap.ui.core.Fragment.byId("bomDialog", "list");

                _oDialog.setModel(new sap.ui.model.json.JSONModel());
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                Filter.setFilterModels(_oDialog, _aFilterItems);
            }

            return _oDialog;
        },

        getMaterial: function(sEQUNR) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = SelectFromBOMDialog.getDialog();
            if (!oDialog.isOpen()) {
                oDialog.open();
            }

            var oModel = oDialog.getModel();
            oModel.setData([]);
            $.ajax("/ws_restful_data_controller/equipment_bom?EQUNR=" + sEQUNR).done(function(aResponseData) {
                oModel.setData(aResponseData);
            });

            return _oPendingSelection;
        },

        onSelect: function(oEvent) {
            var aContexts = _oTable.getSelectedContexts();
            var aMaterials = aContexts.map(function(oContext) { return oContext.getModel().getProperty(oContext.getPath()); });

            if (_oPendingSelection) {
                _oPendingSelection.resolve(aMaterials);
            }

            SelectFromBOMDialog.close();
            _oTable.removeSelections();
        },

        close: function() {
            var oDialog = SelectFromBOMDialog.getDialog();
            oDialog.close();
        },

        onCancel: function() {
            if (_oPendingSelection) {
                _oPendingSelection.reject();
            }
        },

        onFilter: function(oEvent) {
            Filter.filterList(_oTable);
        },

        onClearFilter: function(oEvent) {
            Filter.clearFilters(_oTable);
        },

        onSortPress: function(oEvent) {
            if (!_oSortDialog) {
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectFromBOMSort", this);
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
}(dep.fiori.lib.util.SelectFromBOMDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));