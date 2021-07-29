jQuery.sap.declare("dep.fiori.equipmentmodel.block.Hierarchy");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.equipmentmodel.block.Hierarchy", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.equipmentmodel.block.hierarchy",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.equipmentmodel.block.hierarchy",
                type: "XML"
            }
        }
    }
});