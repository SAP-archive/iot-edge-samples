jQuery.sap.declare("dep.fiori.extenderconfig.block.Setup");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.extenderconfig.block.Setup", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.extenderconfig.block.setup",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.extenderconfig.block.setup",
                type: "XML"
            }
        }
    }
});