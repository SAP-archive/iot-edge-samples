jQuery.sap.declare("dep.fiori.equipment.block.Hierarchy");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.equipment.block.Hierarchy", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.equipment.block.hierarchy",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.equipment.block.hierarchy",
                type: "XML"
            }
        }
    }
});