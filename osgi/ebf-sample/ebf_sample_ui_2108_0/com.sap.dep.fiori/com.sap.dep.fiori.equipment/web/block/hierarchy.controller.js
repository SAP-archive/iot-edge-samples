jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.equipment.block.hierarchy", {
        onInit: function() {
            this.setKey("EQUNR");
            this.setBlockId("hierarchy");
            
            this.mHierarchy = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mHierarchy, "hierarchy");
            
            this.oHierarchyTable = this.byId("hierarchyTable");
        },
        
        loadData: function(sEQUNR) {
            this.loadHierarchy(sEQUNR);
        },
        
        loadHierarchy: function(sEQUNR) {
            var self = this;
            var sURL = "/ws_restful_asset_core_controller/equip_hierarchy?EQUNR=" + sEQUNR;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                self.mHierarchy.setData(oResponseData);
                self.selectEquipInHierarchy(oResponseData, sEQUNR);
            }));
        },
        
        selectEquipInHierarchy: function(oHierarchyData, sEQUNR) {
            // Find path in the hierarchy to the equipment
            var aPath = this.getHierarchyPath(oHierarchyData.COMPONENTS, sEQUNR, []);
            // Expand all nodes in the path
            this.oHierarchyTable.collapseAll();
            var iCount = 0;
            for (var i = 0; i < aPath.length; i++) {
                iCount += aPath[i];
                this.oHierarchyTable.expand(iCount + i);
            }
            // Select the equipment in the table
            var iIndex = iCount + aPath.length - 1;
            this.oHierarchyTable.setSelectedIndex(iIndex);
            if (iIndex < this.oHierarchyTable.getFirstVisibleRow() || 
                    iIndex > this.oHierarchyTable.getFirstVisibleRow() + this.oHierarchyTable.getVisibleRowCount() - 1) {
                this.oHierarchyTable.setFirstVisibleRow(iIndex);
            }
        },
        
        getHierarchyPath: function(aData, sEQUNR, aCurrPath) {
            for (var i = 0; i < aData.length; i++) {
                var aPath = aCurrPath.concat(i);
                if (aData[i].ID === sEQUNR) {
                    return aPath;
                }
                if (aData[i].COMPONENTS) {
                    aResult = this.getHierarchyPath(aData[i].COMPONENTS, sEQUNR, aPath);
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
            var oObject = oContext.getObject();
            switch(oObject.OBJECT_TYPE) {
                case "EQU":
                    this.getView().getModel("router").getData().navTo("detail", {
                        EQUNR: oObject.ID,
                        block: this.getBlockId()
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
        
        objTypeFormatter: function(sType) {
            var sText = "";
            switch(sType) {
                case "EQU":
                    sText = this.getText("ObjectType.equipment");
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