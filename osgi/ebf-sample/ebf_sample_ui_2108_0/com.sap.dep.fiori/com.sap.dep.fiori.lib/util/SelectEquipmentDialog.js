jQuery.sap.setObject("dep.fiori.lib.util.SelectEquipmentDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectEquipmentDialog, Utilities, DataAccess, Filter) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oSortDialog = null;
    
    var _aFilterItems = [
        { key: "EQUNR", label: "{i18nGlobal>EquipmentSelect.equipment}" },
        { key: "EQKTX", label: "{i18nGlobal>General.description}" },
        { key: "TPLNR", label: "{i18nGlobal>General.location}" },
        { key: "PLTXT", label: "{i18nGlobal>EquipmentSelect.locationDesc}" }
    ];

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectEquipmentDialog, {
        getDialog: function(sEntityPath) {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("equipmentDialog", "dep.fiori.lib.frag.selectEquipment", this);
                _oTable = sap.ui.core.Fragment.byId("equipmentDialog", "list");

                // _oDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                Filter.setFilterModels(_oDialog, _aFilterItems);

                _oDialog.setModel(new sap.ui.model.json.JSONModel({
                    Equipment: []
                }), "odata");
                $.ajax("/ws_restful_data_controller/equipment").done(function(aResponseData) {
                    _oDialog.getModel("odata").setProperty("/Equipment", aResponseData);
                });
            }

            return _oDialog;
        },

        getEquipment: function(sEntityPath, oInitialFilters) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = SelectEquipmentDialog.getDialog(sEntityPath);
            if (!oDialog.isOpen()) {
                oDialog.open();
            }

            return _oPendingSelection;
        },

        onSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");

            var oMaterial = oContext.getModel().getProperty(oContext.getPath());

            if (_oPendingSelection) {
                _oPendingSelection.resolve(oMaterial);
            }

            SelectEquipmentDialog.close();
            oListItem.setSelected(false);
        },

        close: function() {
            var oDialog = SelectEquipmentDialog.getDialog();
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
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectEquipmentSort", this);
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
}(dep.fiori.lib.util.SelectEquipmentDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));