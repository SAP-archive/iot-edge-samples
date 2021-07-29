jQuery.sap.declare("dep.fiori.extenderconfig.block.UriConfig");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.extenderconfig.block.UriConfig", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.extenderconfig.block.uriConfig",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.extenderconfig.block.uriConfig",
                type: "XML"
            }
        }
    }
});