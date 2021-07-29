jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.equipmentmodel.block.hierarchy", {
        onInit: function() {
            this.setKey("MODEL_ID");
            this.setBlockId("hierarchy");
            
            this.mHierarchy = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mHierarchy, "hierarchy");
            
            this.oHierarchyTable = this.byId("hierarchyTable");
        },
        
        loadData: function(sModelId) {
            this.loadHierarchy(sModelId);
        },
        
        loadHierarchy: function(sModelId) {
            var self = this;
            var sURL = "/ws_restful_asset_core_controller/equip_model_hierarchy?MODEL_ID=" + sModelId;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                self.mHierarchy.setData(oResponseData);
                self.selectEquipModelInHierarchy(oResponseData, sModelId);
            }));
        },
        
        selectEquipModelInHierarchy: function(oHierarchyData, sModelId) {
            // Find first path in the hierarchy to the model
            var aPath = this.getHierarchyPath(oHierarchyData.COMPONENTS, sModelId, []);
            // Expand all nodes in the path
            this.oHierarchyTable.collapseAll();
            var iCount = 0;
            for (var i = 0; i < aPath.length; i++) {
                iCount += aPath[i];
                this.oHierarchyTable.expand(iCount + i);
            }
            // Select the model in the table
            var iIndex = iCount + aPath.length - 1;
            this.oHierarchyTable.setSelectedIndex(iIndex);
            if (iIndex < this.oHierarchyTable.getFirstVisibleRow() || 
                    iIndex > this.oHierarchyTable.getFirstVisibleRow() + this.oHierarchyTable.getVisibleRowCount() - 1) {
                this.oHierarchyTable.setFirstVisibleRow(iIndex);
            }
        },
        
        getHierarchyPath: function(aData, sModelId, aCurrPath) {
            for (var i = 0; i < aData.length; i++) {
                var aPath = aCurrPath.concat(i);
                if (aData[i].ID === sModelId) {
                    return aPath;
                }
                if (aData[i].COMPONENTS) {
                    aResult = this.getHierarchyPath(aData[i].COMPONENTS, sModelId, aPath);
                    if (aResult.length > 0) {
                        return aResult;
                    }
                }
            }
            return [];
        },
        
        onHierarchySelectionChange: function(oEvent) {
            var oContext = oEvent.getParameter("rowContext");
            
            if(oContext == null || oContext == undefined){
            	return;
            }
            var oObject = oContext.getModel().getProperty(oContext.getPath());
            
            switch(oObject.OBJECT_TYPE) {
                case "MOD":
                    this.getView().getModel("router").getData().navTo("detail", {
                        MODEL_ID: oObject.ID,
                        block: "hierarchy"
                    });
                    break;
                case "PRT":
                	//commenting the below code because the navigation to spare
                	//parts is not supported via configuration
                    //var sHash = "#depSparePart-display&/" + oObject.PART_ID;
                    //Utilities.navToExternal(sHash);
                    break;
                default:
                    break;
            }
        },
        
        quantityFormatter: function(iMinQuantity, iMaxQuantity) {
            var sText;
            if (iMinQuantity === iMaxQuantity) {
                sText = iMinQuantity;
            } else {
                sText = this.getText("Component.quantityRange", [iMinQuantity, iMaxQuantity]);
            }
            return sText;
        },
        
        mandatoryFormatter: function(iMandatory) {
            var sText;
            switch (iMandatory) {
                case 0:
                    sText = Utilities.geti18nGlobal("General.no");
                    break;
                case 1:
                    sText = Utilities.geti18nGlobal("General.yes");
                    break;
                default:
                    sText = "";
                    break;
            }
            return sText;
        },
        
        objTypeFormatter: function(sType) {
            var sText = "";
            switch(sType) {
                case "MOD":
                    sText = this.getText("ObjectType.model");
                    break;
                case "PRT":
                    sText = this.getText("ObjectType.part");
                    break;
                default:
                    break;
            }
            return sText;
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities));