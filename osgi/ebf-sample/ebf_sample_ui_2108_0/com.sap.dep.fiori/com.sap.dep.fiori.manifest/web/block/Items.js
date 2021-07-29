jQuery.sap.declare("dep.fiori.manifest.block.Items");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.manifest.block.Items", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.manifest.block.items",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.manifest.block.items",
                type: "XML"
            }
        }
    }
});