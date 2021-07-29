jQuery.sap.setObject("dep.fiori.lib.util.SelectPRMaterialDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(SelectPRMaterialDialog, Utilities, DataAccess, Filter) {
    
    var _oMaterialDialog = null;
    var _oPendingSelection = null;
    var _oMaterialTable = null;
    var _oSortDialog = null;
    var _oPopover = null;
    var _oNavContainer = null;
    var _oDetailPage = null;
    var _oMaterialDetailTable = null;
    
    // Assign all these functions to the main object without overwriting
    Object.assign(SelectPRMaterialDialog, {
        getMaterialDialog: function() {
            if (!_oMaterialDialog) {
                _oMaterialDialog = sap.ui.xmlfragment("selectPRMaterial", "dep.fiori.lib.frag.selectPRMaterial", this);
                _oMaterialTable = sap.ui.core.Fragment.byId("selectPRMaterial", "materialList");
                _oNavContainer = sap.ui.core.Fragment.byId("selectPRMaterial", "navContainer");
                _oDetailPage = sap.ui.core.Fragment.byId("selectPRMaterial", "detailPage");
                _oMaterialDetailTable = sap.ui.core.Fragment.byId("selectPRMaterial", "materialDetail");

                var oDataModel = DataAccess.getODataModel("/dep/odata").setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                _oMaterialDialog.setModel(oDataModel, "odata");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel(), "material");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel(), "stockwanted");
                _oMaterialDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel({}), "selected");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel({}), "warning");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel({}), "error");
                _oMaterialDialog.setModel(new sap.ui.model.json.JSONModel(_aListSelectItems), "materialList");
                Filter.setFilterModels(_oMaterialDialog, _aFilterItems);
                
               /* DataAccess.getLookupModel({
                    freightMode: "freight_modes"
                }).done(function(mLookup) { _oMaterialDialog.setModel(mLookup, "lookup"); });*/
                
                Filter.setFilterData(_oMaterialTable, { LIST_PATH: { value: "/Stock_Wanted" } });
                SelectPRMaterialDialog.bindMaterial("/Stock_Wanted");
                SelectPRMaterialDialog.loadStockWantedDetail();
            }

            return _oMaterialDialog;
        },

        getDefaultFormValues: function() {
            return {
                LFDAT: Utilities.date.currDateFormatted()
            };
        },

        getMaterial: function() {
            if (_oPendingSelection !== "pending") {
                _oPendingSelection = $.Deferred();
            }

            var oMaterialDialog = SelectPRMaterialDialog.getMaterialDialog();
            if (!oMaterialDialog.isOpen()) {
                oMaterialDialog.open();
            }

            return _oPendingSelection;
        },

        onMaterialListChange: function(oEvent) {
            SelectPRMaterialDialog.bindMaterial(oEvent.getParameter("selectedItem").getKey());
        },

        bindMaterial: function(sEntityPath) {
            var oContext = new sap.ui.model.Context(_oMaterialTable.getModel("odata"), sEntityPath);
            _oMaterialDialog.getModel("selected").setData({});
            _oMaterialTable.getBinding("items").setContext(oContext);
        },
        
        onMaterialIconPress: function(oEvent) {
            this.openPopoverBy(oEvent.getSource());
        },

        onMaterialSelect: function(oEvent) {
            this.closePopover();
            if (oEvent.getParameter("selected") === false) {
                this.onMaterialDeselect(oEvent);
            } else {
                var aListItems = oEvent.getParameter("listItems");
                var mOData = _oMaterialDialog.getModel("odata");
                var mSelected = _oMaterialDialog.getModel("selected");

                var aMATNRs = [];
                var self = this;
                for (var i = 0; i < aListItems.length; i++) {
                    var oListItem = aListItems[i];
                    var oContext = oListItem.getBindingContext("odata");
                    var oModel = oContext.getModel();
                    var oMaterial = oModel.getProperty(oContext.getPath());

                    mSelected.setProperty("/" + oMaterial.MATNR, true);
                    Object.assign(oMaterial, SelectPRMaterialDialog.getDefaultFormValues());
                    oModel.refresh(true);
                    
                    if (!oModel.getProperty("ONHAND", oContext)) {
                        oModel.read(oContext.getPath(), {
                            urlParameters: {
                                "$expand": "ONHAND"
                            }
                        });

                        aMATNRs.push({
                            MATNR: oMaterial.MATNR
                        });
                    }
                }

                if (aMATNRs.length) {
                    // Check if this material is part of other PRs
                    $.ajax({
                        url: "/ws_restful_data_controller/check_prmaterial_duplicate",
                        method: "POST",
                        data: JSON.stringify([ { PRItemArray: aMATNRs } ])
                    }).done(function(oResponseData) {
                        if (oResponseData.length) {
                            var oModels = {
                                "WARNING": _oMaterialDialog.getModel("warning"),
                                "ERROR": _oMaterialDialog.getModel("error")
                            };

                            for (var i = 0; i < oResponseData.length; i++) {
                                var oModel = oModels[oResponseData[i].CONFLICT_TYPE];
                                var oData = oModel.getData();
                                oData[oResponseData[i].MATNR] = oData[oResponseData[i].MATNR] || [];
                                oData[oResponseData[i].MATNR].push(oResponseData[i]);
                            }

                            oModels.WARNING.refresh(true);
                            oModels.ERROR.refresh(true);
                        }
                    });
                }

                mSelected.refresh(true);
            }
        },

        onMaterialDeselect: function(oEvent) {
            var aListItems = oEvent.getParameter("listItems");
            var mSelected = _oMaterialDialog.getModel("selected");

            for (var i = 0; i < aListItems.length; i++) {
                var oListItem = aListItems[i];
                var oContext = oListItem.getBindingContext("odata");

                var oMaterial = oContext.getModel().getProperty(oContext.getPath());
                mSelected.setProperty("/" + oMaterial.MATNR, false);
            }
            
            mSelected.refresh(true);
        },

        openPopoverBy: function(oControl) {
            if (!_oPopover) {
                _oPopover = sap.ui.xmlfragment("dep.fiori.lib.frag.selectPRMaterialWarning", this);
                _oPopover.setModel(new sap.ui.model.json.JSONModel());
                _oPopover.setModel(_oMaterialDialog.getModel("i18nGlobal"), "i18nGlobal");
            }
            this.closePopover();
            _oPopover.getModel().setData([]);

            var oContext = oControl.getBindingContext("odata");
            var oMaterial = oContext.getModel().getProperty(oContext.getPath());

            var aWarnings = _oMaterialDialog.getModel("warning").getProperty("/" + oMaterial.MATNR) || [];
            var aErrors = _oMaterialDialog.getModel("error").getProperty("/" + oMaterial.MATNR) || [];
            _oPopover.getModel().setData(aErrors.concat(aWarnings));
            _oPopover.openBy(oControl);
        },

        closePopover: function() {
            if (_oPopover && _oPopover.isOpen()) {
                _oPopover.close();
            }
        },

        confirm: function(oEvent) {
            var aListItems = _oMaterialTable.getSelectedItems();

            if (aListItems.length) {
                var aErrors = [];
                var aMaterials = [];
                for (var i = 0; i < aListItems.length; i++) {
                    var oListItem = aListItems[i];
                    var oContext = oListItem.getBindingContext("odata");
                    var oMaterial = oContext.getModel().getProperty(oContext.getPath());

                    if (_oMaterialDialog.getModel("error").getData()[oMaterial.MATNR]) {
                        aErrors.push(oMaterial.MATNR);
                    } else {
                        Object.assign(oMaterial, {
                            STOCK_ON_HAND: oContext.getModel().getProperty("ONHAND/STOCK_ON_HAND", oContext)
                        });
                        delete oMaterial.__metadata;
                        delete oMaterial.ONHAND;
                    }

                    aMaterials.push(oMaterial);
                }

                if (aErrors.length) {
                    sap.m.MessageBox.error(Utilities.geti18nGlobal("MaterialSelect.invalidSelection", [ aErrors.join(", ") ]), {
                        title: Utilities.geti18nGlobal("General.error")
                    });
                } else {
                    if (_oPendingSelection) {
                        _oPendingSelection.resolve(aMaterials, _oMaterialDialog.getModel("warning").getData());
                    }

                    SelectPRMaterialDialog.close();
                    _oMaterialDialog.getModel("selected").setData({});
                    for (var n = 0; n < aListItems.length; n++) {
                        aListItems[n].setSelected(false);
                    }
                }
            } else {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("MaterialSelect.noSelection"));
            }
        },

        close: function() {
            var oMaterialDialog = SelectPRMaterialDialog.getMaterialDialog();
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
            Filter.setFilterData(_oMaterialTable, { LIST_PATH: { value: "/Stock_Wanted" } });
            SelectPRMaterialDialog.bindMaterial("/Stock_Wanted");
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
        },

        popoverTitleFormatter: function(sPurchaseReq, sStatus) {
            var sStatusText = Utilities.geti18nGlobal("PRStatus." + sStatus).toLocaleLowerCase();
            return Utilities.geti18nGlobal("MaterialSelect.warningTitle", [ sPurchaseReq, sStatusText ]);
        },

        popoverDescriptionFormatter: function(sConflictType, sStatus) {
            if (sConflictType === "ERROR") {
                return Utilities.geti18nGlobal("MaterialSelect.warningDescription", [ sStatus.toLocaleLowerCase() ]);
            }
            return "";
        },
        
        iconColorFormatter: function(sMATNR, oWarnings, oErrors) {
            var sColor;
            if (oErrors[sMATNR] && oErrors[sMATNR].length) {
                sColor = sap.ui.core.IconColor.Negative;
            } else if (oWarnings[sMATNR] && oWarnings[sMATNR].length) {
                sColor = sap.ui.core.IconColor.Critical;
            } else {
                sColor = sap.ui.core.IconColor.Neutral;
            }
            return sColor;
        },
        
        iconSrcFormatter: function(sMATNR, oWarnings, oErrors) {
            var sIcon;
            if (oErrors[sMATNR] && oErrors[sMATNR].length) {
                sIcon = "sap-icon://message-error";
            } else if (oWarnings[sMATNR] && oWarnings[sMATNR].length) {
                sIcon = "sap-icon://message-warning";
            } else {
                sIcon = "";
            }
            return sIcon;
        },
        
        loadStockWantedDetail: function() {
            return $.ajax("/ws_restful_data_controller/wanted_stock").done(function(aResponseData) {
                _oMaterialDialog.getModel("stockwanted").setData(aResponseData);
            });
        },
        
        onMaterialPress: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext("odata");
            var oMaterial = oContext.getModel().getProperty(oContext.getPath());
            SelectPRMaterialDialog.navToDetail(oMaterial);
        },
        
        navToDetail: function(oMaterial) {
            _oNavContainer.to(_oDetailPage);
            _oMaterialDialog.getModel("material").setData(oMaterial);
            var aFilters = [
                new sap.ui.model.Filter("ZRES_IND", sap.ui.model.FilterOperator.EQ, ""),
                new sap.ui.model.Filter("ZMATNR", sap.ui.model.FilterOperator.EQ, oMaterial.MATNR)            
            ]; 
            _oMaterialDetailTable.getBinding("items").filter(aFilters);
        },
        
        navBack: function() {
            _oNavContainer.back();
        }
    });
    
    var _aListSelectItems = [
        { path: "/Stock_Wanted", desc: Utilities.geti18nGlobal("MaterialSelect.requiredMaterials") },
        { path: "/Unique_Material", desc: Utilities.geti18nGlobal("MaterialSelect.allMaterials") }
    ];
    
    var _aFilterItems = [
        { key: "LIST_PATH", label: "{i18nGlobal>MaterialSelect.materialList}", type: Filter.InputType.Select,
          items: { path: "materialList>/", key: "{materialList>path}", text: "{materialList>desc}" },
          change: SelectPRMaterialDialog.onMaterialListChange },
        { key: "MATNR", label: "{i18nGlobal>MaterialSelect.material}" },
        { key: "MAKTX", label: "{i18nGlobal>General.description}" }
    ];
}(dep.fiori.lib.util.SelectPRMaterialDialog, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter));