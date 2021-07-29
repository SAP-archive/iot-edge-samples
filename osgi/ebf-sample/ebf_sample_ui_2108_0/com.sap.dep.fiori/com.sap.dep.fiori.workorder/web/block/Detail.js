jQuery.sap.declare("dep.fiori.workorder.block.Detail");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.workorder.block.Detail", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.workorder.block.detail",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.workorder.block.detail",
                type: "XML"
            }
        }
    }
});