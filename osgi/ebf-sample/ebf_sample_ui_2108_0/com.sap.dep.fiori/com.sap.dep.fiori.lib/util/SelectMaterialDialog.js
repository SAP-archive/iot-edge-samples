jQuery.sap.setObject("dep.fiori.lib.util.SelectMaterialDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess")
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectMaterialDialog, Utilities, DataAccess, Filter) {
    var _oMaterialDialog = null;
    var _oPendingSelection = null;
    var _oMaterialTable = null;
    var _oSortDialog = null;
    var _sEntityPath = "/Unique_Material";
    var _oInitialFilters = {};
    
    var _aFilterItems= [
        { key: "MATNR", label: "{i18nGlobal>MaterialSelect.material}" },
        { key: "LGORT", label: "{i18nGlobal>General.location}" },
        { key: "MAKTX", label: "{i18nGlobal>General.description}" },
        { key: "NAME1", label: "{i18nGlobal>MaterialSelect.manufacturer}" },
        { key: "MFRPN", label: "{i18nGlobal>MaterialSelect.manufacturerPartNo}" }
    ];

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectMaterialDialog, {
        getMaterialDialog: function(sEntityPath) {
            if (!_oMaterialDialog) {
                _oMaterialDialog = sap.ui.xmlfragment("materialDialog", "dep.fiori.lib.frag.selectMaterial", this);
                _oMaterialTable = sap.ui.core.Fragment.byId("materialDialog", "list");

                _oMaterialDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oMaterialDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                Filter.setFilterModels(_oMaterialDialog, _aFilterItems);
            }

            return _oMaterialDialog;
        },

        getMaterial: function(sEntityPath, oInitialFilters) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oMaterialDialog = SelectMaterialDialog.getMaterialDialog(sEntityPath);

            oInitialFilters = oInitialFilters || {};
            Filter.setFilterData(_oMaterialTable, oInitialFilters);

            // Only rebind if the new binding would differ from the previous one
            if (_sEntityPath !== sEntityPath ||
                oInitialFilters.MATNR !== _oInitialFilters.MATNR ||
                oInitialFilters.LGORT !== _oInitialFilters.LGORT ||
                oInitialFilters.MAKTX !== _oInitialFilters.MAKTX ||
                oInitialFilters.NAME1 !== _oInitialFilters.NAME1 ||
                oInitialFilters.MFRPN !== _oInitialFilters.MFRPN) {
                // Keep track of the previous filters to check future ones
                _oInitialFilters = oInitialFilters;
                SelectMaterialDialog.bindMaterial(sEntityPath);
            }

            if (!oMaterialDialog.isOpen()) {
                oMaterialDialog.open();
            }

            return _oPendingSelection;
        },

        bindMaterial: function(sEntityPath) {
            _sEntityPath = sEntityPath || "/Unique_Material";
            
            var oContext = new sap.ui.model.Context(_oMaterialTable.getModel("odata"), _sEntityPath);
            _oMaterialTable.getBinding("items").setContext(oContext);
            
            SelectMaterialDialog.onFilter();
        },

        onMaterialSelect: function(oEvent) {
            var aContexts = _oMaterialTable.getSelectedContexts();
            var aMaterials = aContexts.map(function(oContext) { return oContext.getModel().getProperty(oContext.getPath()); });

            if (_oPendingSelection) {
                _oPendingSelection.resolve(aMaterials);
            }

            SelectMaterialDialog.close();
            _oMaterialTable.removeSelections();
        },

        close: function() {
            var oMaterialDialog = SelectMaterialDialog.getMaterialDialog();
            oMaterialDialog.close();
        },

        onCancel: function() {
            if (_oPendingSelection) {
                _oPendingSelection.reject();
            }
        },

        onFilter: function(oEvent) {
            Filter.filterList(_oMaterialTable);
        },

        onClearFilter: function(oEvent) {
            Filter.clearFilters(_oMaterialTable);
        },

        onSortPress: function(oEvent) {
            if (!_oSortDialog) {
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectMaterialSort", this);
                _oSortDialog.setModel(_oMaterialDialog.getModel("i18nGlobal"), "i18nGlobal");
            }
            _oSortDialog.open();
        },

        onSort: function(oEvent) {
            var sSortKey = oEvent.getParameter("sortItem").getKey();
            var bDescending = oEvent.getParameter("sortDescending");
            var oSorter = new sap.ui.model.Sorter(sSortKey, bDescending);

            if (_oMaterialTable) {
                var oBinding = _oMaterialTable.getBinding("items");
                oBinding.sort(oSorter);
            }
        }
    });
}(dep.fiori.lib.util.SelectMaterialDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));