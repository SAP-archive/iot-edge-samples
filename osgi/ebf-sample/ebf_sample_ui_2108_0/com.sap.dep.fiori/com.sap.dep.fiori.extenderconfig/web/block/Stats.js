jQuery.sap.declare("dep.fiori.extenderconfig.block.Stats");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.extenderconfig.block.Stats", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.extenderconfig.block.stats",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.extenderconfig.block.stats",
                type: "XML"
            }
        }
    }
});