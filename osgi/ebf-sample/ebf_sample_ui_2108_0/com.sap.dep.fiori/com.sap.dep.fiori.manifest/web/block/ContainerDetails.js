jQuery.sap.declare("dep.fiori.manifest.block.ContainerDetails");
jQuery.sap.require("sap.uxap.BlockBase");

sap.uxap.BlockBase.extend("dep.fiori.manifest.block.ContainerDetails", {
    metadata: {
        views: {
            Expanded: {
                viewName:"dep.fiori.manifest.block.containerDetails",
                type: "XML"
            },
            Collapsed: {
                viewName:"dep.fiori.manifest.block.containerDetails",
                type: "XML"
            }
        }
    }
});