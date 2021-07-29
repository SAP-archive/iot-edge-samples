jQuery.sap.declare("dep.fiori.workorder.block.DocFlow");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.workorder.block.DocFlow", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.workorder.block.docflow",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.workorder.block.docflow",
                type: "XML"
            }
        }
    }
});