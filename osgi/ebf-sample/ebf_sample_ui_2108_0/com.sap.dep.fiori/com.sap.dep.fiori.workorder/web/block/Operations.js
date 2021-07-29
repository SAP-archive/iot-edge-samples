jQuery.sap.declare("dep.fiori.workorder.block.Operations");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.workorder.block.Operations", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.workorder.block.operations",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.workorder.block.operations",
                type: "XML"
            }
        }
    }
});