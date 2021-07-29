jQuery.sap.declare("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Print");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.core.util.Export");
jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");

(function(ControllerBase, DataAccess, Filter, Print, Utilities) {
    ControllerBase.extend("dep.fiori.lib.controller.ListControllerBase", {
        
        _aKey: [],
        _sDetailRoute: "detail",
        _sODataUrl: "/dep/odata",
        _sPrintObjType: "",
        _sSortFragment: "",
        _sTableId: "list",
        _oDefaultFilterData: {},
        _sModelName: "odata",

        /**
         * onInit lifecycle method
         */
        onInit: function() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this._mOData = DataAccess.getODataModel(this._sODataUrl);
            this.getView().setModel(this._mOData, this._sModelName);
            
            Filter.setFilterModels(this.getView(), this.getFilterItems());
        },

        /**
         * Set the object key property (e.g. AUFNR)
         */
        setKey: function(aKey) {
            if (!Array.isArray(aKey)) {
                aKey = [ aKey ];
            }
            this._aKey = aKey;
        },

        /**
         * Set OData service url
         */
        setODataServiceUrl: function(sUrl) {
            this._sODataUrl = sUrl;
        },

        /**
         * Set sort fragment name
         */
        setSortFragment: function(sFragmentName) {
            this._sSortFragment = sFragmentName;
        },

        /**
         * Set Table control
         */
        setTable: function(oTable) {
            this._oTable = oTable;
        },

        /**
         * Set default filter data and update list
         */
        setDefaultFilterData: function(oFilterData) {
            Filter.setFilterData(this.getTable(), oFilterData);
        },
        
        /**
         * Set detail route name
         */
        setDetailRoute: function(sDetailRoute) {
            this._sDetailRoute = sDetailRoute;
        },
        
        /**
         * Set detail block name to nav to
         */
        setDetailBlock: function(sDetailBlock) {
            this._sDetailBlock = sDetailBlock;
        },
        
        /**
         * Set print object type
         */
        setPrintObjType: function(sPrintObjType) {
            this._sPrintObjType = sPrintObjType;
        },
        
        /**
         * Set model name
         */
        setModelName: function(sModelName) {
            this._sModelName = sModelName;
        },
        
        /**
         * Get Table control
         */
        getTable: function() {
            if (!this._oTable) {
                this._oTable = this.byId(this._sTableId);
            }
            return this._oTable;
        },
        
        /**
         * Get OData model
         */
        getODataModel: function() {
            return this._mOData;
        },

        /**
         * Table filter event
         */
        onFilter: function(oEvent) {
            Filter.filterList(this.getTable());
        },

        /**
         * Clear filter event
         */
        onClearFilter: function(oEvent) {
            Filter.clearFilters(this.getTable());
            Filter.setFilterData(this.getTable(), this._oDefaultFilterData);
        },

        /**
         * Sort button press event
         *
         * Assumes setSortFragment has been called
         */
        onSortPress: function(oEvent) {
            if (!this._oSortDialog) {
                this._oSortDialog = sap.ui.xmlfragment(this._sSortFragment, this);
                this.getView().addDependent(this._oSortDialog);
            }
            this._oSortDialog.open();
        },

        /**
         * Sort table event
         */
        onSort: function(oEvent) {
            var sSortKey = oEvent.getParameter("sortItem").getKey();
            var bDescending = oEvent.getParameter("sortDescending");
            var oSorter = new sap.ui.model.Sorter(sSortKey, bDescending);

            var oBinding = this.getTable().getBinding("items");
            oBinding.sort(oSorter);
        },

        /**
         * List item press event
         *
         * Assumes setKey has been called
         */
        onItemPress: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var modelName = this._sModelName;
            var oContext = oListItem.getBindingContext(modelName);
            //For the case where the model name is not bound to context
            if(null == oContext || oContext == undefined){
            	oContext = oListItem.getBindingContext();
            }
            var oObject = oContext.getObject();

            var oNavArgs = {};
            for (var i = 0; i < this._aKey.length; i++) {
                oNavArgs[this._aKey[i]] = oObject[this._aKey[i]];
            }
            oNavArgs.block = this._sDetailBlock;
            this._oRouter.navTo(this._sDetailRoute, oNavArgs);
        },

        /**
         * Create button press event
         */
        onCreatePress: function(oEvent) {
            this._oRouter.navTo("create");
        },
  
        /**
         * Print button press event
         */
        onPrintPress: function(oEvent) {
            var aContexts = this.getTable().getSelectedContexts();
            var aObjects = aContexts.map(function(oContext) { return oContext.getObject(); });
            var aIds = aObjects.map(function(oObj) {
                return this._aKey.map(function(sKey) { return oObj[sKey]; });
            }.bind(this));
            Print.openPrintWindow(this._sPrintObjType, aIds);
        },
        
        /**
         * Route matched event handler
         *
         * Can override if needed
         */
        onRouteMatched: function(oEvent) {
            return;
        },

        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBindingContext(this._sModelName);
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        },
        
        /**
         * Export selected items to CSV, or whole list if nothing selected
         */
        onExportPress: function(oEvent) {
            var self = this;
            var aContexts = this.getTable().getSelectedContexts();
            var oExportModel = this.getTable().getModel(this._sModelName);
            var sConfirmProp = "General.exportAll";
            
            if (aContexts.length > 0) {
                var aData = aContexts.map(function(oContext) { return oContext.getObject(); });
                oExportModel = new sap.ui.model.json.JSONModel();
                oExportModel.setData({ Workorder: aData });
                sConfirmProp = "General.exportSelected";
            }
            
            var sItemsPath = this.getTable().getBinding("items").getPath();
            var iRowCount = oExportModel.getProperty(sItemsPath).length;
            sap.m.MessageBox.confirm(Utilities.geti18nGlobal(sConfirmProp, iRowCount), {
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        self.exportData(oExportModel, sItemsPath);
                    }
                }
            });
        },
        
        /**
         * Export data to CSV
         */
        exportData: function(oExportModel, sItemsPath) {
            var oExport = new sap.ui.core.util.Export({
                exportType: new sap.ui.core.util.ExportTypeCSV(),
                models: oExportModel,
                rows: {
                    path: sItemsPath
                },
                columns: this.getExportColumns()
            });
        
            oExport.saveFile().catch(function(sError) {
                sap.m.MessageBox.error(Utilities.geti18nGlobal("Error.exportError", sError));
            }).then(function() {
                oExport.destroy();
            });
        },
        
        /**
         * Create export columns based on table cell binding
         */
        getExportColumns : function() {
            var aItems = this.getTable().getItems();
            var aTableColumns = this.getTable().getColumns();
            var aExportColumns = [];

            for (var i = 0; i < aTableColumns.length; i++) {
                var sPath = null;
                var fnFormatter = null;
                
                if (aItems.length > 0) {
                    var oCell = aItems[0].getCells()[i];
                    var oLabel = oCell;
                    if (oCell.getItems) {
                        oLabel = oCell.getItems()[0];
                    }
                    var oBinding = oLabel.getBinding("text");
                    sPath = oBinding.getPath();
                    fnFormatter = oBinding.getFormatter();
                }
                
                var oExportColumn = new sap.ui.core.util.ExportColumn({
                    name: aTableColumns[i].getHeader().getText(),
                    template: new sap.ui.core.util.ExportCell({
                        content: { path: sPath, formatter: fnFormatter }
                    })
                });
                aExportColumns.push(oExportColumn);
            }
            
            return aExportColumns;
        },
        
        /**
         * Get filter item config data to be used with 
         * dep.fiori.lib.util.Filter.filterItemFactory
         * 
         * Can override if needed
         */
        getFilterItems: function() {
            return [];
        },
        
        /**
         * Get properties for edge error filter item
         */
        getEdgeErrorFilterItem: function() {
            return {
                key: "EDGE_ERRORS",
                label: "{i18nGlobal>General.edgeErrors}",
                type: Filter.InputType.Boolean,
                compareValue: "",
                filterOperator: sap.ui.model.FilterOperator.NE
            };
        }
    });
}(dep.fiori.lib.controller.ControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Print, dep.fiori.lib.util.Utilities));