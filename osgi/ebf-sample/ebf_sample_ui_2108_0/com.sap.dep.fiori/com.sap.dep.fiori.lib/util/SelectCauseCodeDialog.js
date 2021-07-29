jQuery.sap.setObject("dep.fiori.lib.util.SelectCauseCodeDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectCauseCodeDialog, Utilities, DataAccess, Filter) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oSortDialog = null;
    
    var _aFilterItems = [
        { key: "URGRP", label: "{i18nGlobal>CauseCodeSelect.group}" },
        { key: "URCOD", label: "{i18nGlobal>CauseCodeSelect.code}" },
        { key: "URTXT", label: "{i18nGlobal>CauseCodeSelect.text}" }
    ];

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectCauseCodeDialog, {
        getDialog: function(sEntityPath) {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("causeCodeDialog", "dep.fiori.lib.frag.selectCauseCode", this);
                _oTable = sap.ui.core.Fragment.byId("causeCodeDialog", "list");

                //_oDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                Filter.setFilterModels(_oDialog, _aFilterItems);

                _oDialog.setModel(new sap.ui.model.json.JSONModel({
                    Cause_Code: []
                }), "odata");
                $.ajax("/ws_restful_data_controller/notifications_cause").done(function(aResponseData) {
                    _oDialog.getModel("odata").setProperty("/Cause_Code", aResponseData);
                });
            }

            return _oDialog;
        },

        getCauseCode: function(sEntityPath, oInitialFilters) {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oDialog = SelectCauseCodeDialog.getDialog(sEntityPath);
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

            SelectCauseCodeDialog.close();
            oListItem.setSelected(false);
        },

        close: function() {
            var oDialog = SelectCauseCodeDialog.getDialog();
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
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectCauseCodeSort", this);
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
}(dep.fiori.lib.util.SelectCauseCodeDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));