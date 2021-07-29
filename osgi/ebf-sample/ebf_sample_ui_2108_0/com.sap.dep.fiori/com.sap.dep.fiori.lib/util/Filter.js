jQuery.sap.setObject("dep.fiori.lib.util.Filter", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function (Filter, Utilities) {

    // Assign all these functions to the main object without overwriting
    Object.assign(Filter, {
        
        InputType: {
            Boolean: "Boolean",
            DateRange: "DateRange",
            MultiInput: "MultiInput",
            MultiSelect: "MultiSelect",
            Select: "Select"
        },
        
        setFilterModels: function(oControl, aFilterItems) {
            var oFilterItemsModel = new sap.ui.model.json.JSONModel(aFilterItems);
            var oFilterModel = new sap.ui.model.json.JSONModel();
            
            for (var i = 0; i < aFilterItems.length; i++) {
                oFilterModel.setProperty("/" + aFilterItems[i].key, {
                    value: null,
                    value2: null,
                    values: [],
                    filterOperator: aFilterItems[i].filterOperator || sap.ui.model.FilterOperator.Contains,
                    fnTest: aFilterItems[i].fnTest || null
                });
            }
            
            oControl.setModel(oFilterItemsModel, "filterItems");
            oControl.setModel(oFilterModel, "filter");
        },
        
        setFilterData: function(oList, oFilterData) {
            var oFilterModel = oList.getModel("filter");
            for (var sProp in oFilterData) {
                Object.assign(oFilterModel.getData()[sProp], oFilterData[sProp]);
            }
            oFilterModel.refresh(true);
            Filter.filterList(oList);
        },
        
        filterItemFactory: function(sId, oContext) {
            var sKey = oContext.getProperty("key");
            var sPath = "filter>/" + sKey;
            
            var oControl;
            switch (oContext.getProperty("type")) {
                case Filter.InputType.Boolean:
                    oControl = new sap.m.MultiComboBox({
                        selectedKeys: { path: sPath + "/values" },
                        items: [
                            new sap.ui.core.ListItem({
                                key: oContext.getProperty("compareValue") || "",
                                text: oContext.getProperty("trueText") || Utilities.geti18nGlobal("General.yes")
                            }),
                            new sap.ui.core.ListItem({
                                key: "!" + (oContext.getProperty("compareValue") || ""),
                                text: oContext.getProperty("falseText") || Utilities.geti18nGlobal("General.no")
                            })
                        ]
                    });
                    break;
                case Filter.InputType.DateRange:
                    oControl = new sap.m.DateRangeSelection({
                        dateValue: { path: sPath + "/value" },
                        secondDateValue: { path: sPath + "/value2" }
                    });
                    break;
                case Filter.InputType.MultiSelect:
                    oControl = new sap.m.MultiComboBox({
                        selectedKeys: { path: sPath + "/values" },
                        items: {
                            path: oContext.getProperty("items/path"),
                            template: new sap.ui.core.ListItem({
                                key: oContext.getProperty("items/key"),
                                text: oContext.getProperty("items/text"),
                                additionalText: oContext.getProperty("items/additionalText")
                            })
                        }
                    });
                    break;
                case Filter.InputType.Select:
                    oControl = new sap.m.Select({
                        selectedKey: { path: sPath + "/value" },
                        items: {
                            path: oContext.getProperty("items/path"),
                            template: new sap.ui.core.ListItem({
                                key: oContext.getProperty("items/key"),
                                text: oContext.getProperty("items/text"),
                                additionalText: oContext.getProperty("items/additionalText")
                            })
                        },
                        change: oContext.getProperty("change")
                    });
                    break;
                default:
                    oControl = new sap.m.MultiInput({
                        showValueHelp: false,
                        tokenUpdate: Filter.onTokenUpdate,
                        tokens: {
                            path: sPath + "/values",
                            template: new sap.m.Token({
                                key: "{filter>}",
                                text: "{filter>}"
                            })
                        }
                    });
                    oControl.addValidator(Filter.tokenValidator);
                    break;
            }
            
            var oFilterItem = new sap.ui.comp.filterbar.FilterGroupItem({
                name: sKey,
                label: oContext.getProperty("label"),
                visibleInAdvancedArea: oContext.getProperty("visible"),
                groupName: sap.ui.comp.filterbar.FilterBar.INTERNAL_GROUP,
                partOfCurrentVariant: true,
                visibleInFilterBar: true,
                control: oControl
            });
            
            return oFilterItem;
        },
        
        tokenValidator: function(oArgs) {
            return new sap.m.Token({ key: oArgs.text, text: oArgs.text });
        },
        
        onTokenUpdate: function(oEvent) {
            var oInput = oEvent.getSource();
            var sBindingPath = oInput.getBinding("tokens").getPath();
            var aTokens = oInput.getTokens();
            var aData = aTokens.map(function(oToken) { return oToken.getText(); });
            oInput.getModel("filter").setProperty(sBindingPath, aData);
        },
        
        filterList: function(oList) {
            var oCriteria = oList.getModel("filter").getData();

            var aFilters = [];
            for (var sKey in oCriteria) {
                if (oCriteria.hasOwnProperty(sKey) && oCriteria[sKey]) {
                    if (sKey === "LIST_PATH") {
                        // Ignore special filter for changing list binding path
                        continue;
                    }
                    
                    var sFilterOperator = oCriteria[sKey].filterOperator;
                    var sValue = oCriteria[sKey].value;
                    if (sValue) {
                        sValue = sValue instanceof Date ? Utilities.date.toYYYYMMDD(sValue) : sValue;
                        var sValue2 = oCriteria[sKey].value2;
                        if (sValue2) {
                            sValue2 = sValue2 instanceof Date ? Utilities.date.toYYYYMMDD(sValue2) : sValue2;
                            aFilters.push(new sap.ui.model.Filter(sKey, sap.ui.model.FilterOperator.BT, sValue, sValue2));
                        } else {
                            aFilters.push(new sap.ui.model.Filter(sKey, sFilterOperator, sValue));
                        }
                    }
                    
                    var aValues = oCriteria[sKey].values;
                    for (var i = 0; i < aValues.length; i++) {
                        var sCriteria = aValues[i];
                        var fnTest = oCriteria[sKey].fnTest;
                        if (fnTest) {
                            if (sCriteria.startsWith("!")) {
                                fnTest = function(oData) { return !oCriteria[sKey].fnTest(oData); };
                            }
                            aFilters.push(new sap.ui.model.Filter("", fnTest));
                        } else {
                            sFilterOperator = oCriteria[sKey].filterOperator;
                            if (sCriteria.startsWith("!")) {
                                sFilterOperator = sFilterOperator === sap.ui.model.FilterOperator.EQ ? sap.ui.model.FilterOperator.NE : sap.ui.model.FilterOperator.EQ;
                                sCriteria = sCriteria.substring(1);
                            }
                            aFilters.push(new sap.ui.model.Filter(sKey, sFilterOperator, sCriteria));
                        }
                    }
                }
            }

            oList.getBinding("items").filter(aFilters);
        },
        
        clearFilters: function(oList) {
            var oCriteria = oList.getModel("filter").getData();
            for (var sKey in oCriteria) {
                if (oCriteria.hasOwnProperty(sKey) && oCriteria[sKey]) {
                    oCriteria[sKey].value = null;
                    oCriteria[sKey].value2 = null;
                    oCriteria[sKey].values = [];
                }
            }
            Filter.filterList(oList);
            oList.getModel("filter").refresh();
        }
        
    });
}(dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));