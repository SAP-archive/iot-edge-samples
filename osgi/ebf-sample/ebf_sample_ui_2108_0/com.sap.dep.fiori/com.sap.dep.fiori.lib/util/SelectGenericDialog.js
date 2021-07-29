jQuery.sap.setObject("dep.fiori.lib.util.SelectGenericDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectGenericDialog, Utilities, DataAccess, Filter) {
    var _oDialog = null;
    var _oPendingSelection = null;
    var _oTable = null;
    var _oFilterBar = null;
    var _aColumns = [];
    var _oSortDialog = null;
    var _sEntityPath = null;

    // Assign all these functions to the main object without overwriting
    Object.assign(SelectGenericDialog, {
        getDialog: function(sEntityPath, aColumns) {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("selectGenericDialog", "dep.fiori.lib.frag.selectGeneric", this);
                _oTable = sap.ui.core.Fragment.byId("selectGenericDialog", "list");
                _oFilterBar = sap.ui.core.Fragment.byId("selectGenericDialog", "filterBar");

                _oDialog.setModel(DataAccess.getODataModel("/dep/odata"), "odata");
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                _oDialog.setModel(new sap.ui.model.json.JSONModel([]), "items");
            }

            return _oDialog;
        },

        getEntity: function(oArgs) {
            _oPendingSelection = $.Deferred();

            var oDialog = SelectGenericDialog.getDialog(sEntityPath);
            var sEntityPath = oArgs.sEntityPath;
            _aColumns = oArgs.aColumns;

            // Only rebind if the new binding would differ from the previous one
            if (typeof(sEntityPath) !== 'string' || _sEntityPath !== sEntityPath) {
                SelectGenericDialog.bind(sEntityPath, _aColumns);
            }

            if (!oDialog.isOpen()) {
                oDialog.open();
            }

            return _oPendingSelection;
        },

        bind: function(sEntityPath, aColumns) {
            var oDialog = SelectGenericDialog.getDialog(sEntityPath);
            var sModelname = null;

            // Do we already have the array, or are we binding an OData URL?
            if (typeof(sEntityPath) === 'string') {
                _sEntityPath = sEntityPath;
                sModelname = "odata";
                oDialog.getModel("items").setData([]);
            } else {
                _sEntityPath = null;
                sModelname = "items";
                oDialog.getModel("items").setData(sEntityPath);
                sEntityPath = "/";
            }

            _oFilterBar.destroyFilterItems();
            _oFilterBar.removeAllFilterItems();
            _oTable.destroyColumns();
            _oTable.unbindAggregation("items");

            var aFilterItems = [];
            var aCells = [];
            for (var i = 0; i < aColumns.length; i++) {
                aFilterItems.push({ key: aColumns[i].sField, label: aColumns[i].sHeader });

                _oTable.addColumn(new sap.m.Column({
                    vAlign: sap.ui.core.VerticalAlign.Middle,
                    header: new sap.m.Title({
                        text: aColumns[i].sHeader
                    })
                }));

                aCells.push(new sap.m.Label({
                    text: "{" + sModelname + ">" + aColumns[i].sField + "}"
                }));
            }

            Filter.setFilterModels(_oDialog, aFilterItems);
            
            _oTable.bindAggregation("items", {
                path: sModelname + ">" + sEntityPath,
                template: new sap.m.ColumnListItem({
                    type: sap.m.ListType.Active,
                    cells: aCells
                })
            });
        },

        onSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata") || oListItem.getBindingContext("items");

            var oEntity = oContext.getModel().getProperty(oContext.getPath());

            if (_oPendingSelection) {
                _oPendingSelection.resolve(oEntity);
            }

            SelectGenericDialog.close();
            oListItem.setSelected(false);
        },

        clear: function() {
            var oEmpty = {};
            for (var i = 0; i < _aColumns.length; i++) {
                oEmpty[_aColumns[i].sField] = "";
            }

            if (_oPendingSelection) {
                _oPendingSelection.resolve(oEmpty);
            }

            SelectGenericDialog.close();
        },

        close: function() {
            var oDialog = SelectGenericDialog.getDialog();
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
                _oSortDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.selectMaterialSort", this);
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
}(dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));