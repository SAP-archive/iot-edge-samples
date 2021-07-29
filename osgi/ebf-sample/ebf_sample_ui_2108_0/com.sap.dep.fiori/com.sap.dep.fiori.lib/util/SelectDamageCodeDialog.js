jQuery.sap.setObject("dep.fiori.lib.util.SelectDamageCodeDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectDamageCodeDialog, Utilities, DataAccess, Filter) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oSortDialog = null;
    
    var _aFilterItems = [
        { key: "FEGRP", label: "{i18nGlobal>DamageCodeSelect.group}" },
        { key: "FECOD", label: "{i18nGlobal>DamageCodeSelect.code}" },
        { key: "FETXT", label: "{i18nGlobal>DamageCodeSelect.text}" }
    ];

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectDamageCodeDialog, {
        getDialog: function(sEntityPath) {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("damageCodeDialog", "dep.fiori.lib.frag.selectDamageCode", this);
                _oTable = sap.ui.core.Fragment.byId("damageCodeDialog", "list");

                // _oDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                Filter.setFilterModels(_oDialog, _aFilterItems);

                _oDialog.setModel(new sap.ui.model.json.JSONModel({
                    Damage_Code: []
                }), "odata");
                $.ajax("/ws_restful_data_controller/notifications_damage").done(function(aResponseData) {
                    _oDialog.getModel("odata").setProperty("/Damage_Code", aResponseData);
                });
            }

            return _oDialog;
        },

        getDamageCode: function(sEntityPath, oInitialFilters) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = SelectDamageCodeDialog.getDialog(sEntityPath);
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

            SelectDamageCodeDialog.close();
            oListItem.setSelected(false);
        },

        close: function() {
            var oDialog = SelectDamageCodeDialog.getDialog();
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
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.SelectDamageCodeSort", this);
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
}(dep.fiori.lib.util.SelectDamageCodeDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));