jQuery.sap.declare("dep.fiori.workorder.block.Attachments");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.workorder.block.Attachments", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.workorder.block.attachments",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.workorder.block.attachments",
                type: "XML"
            }
        }
    }
});