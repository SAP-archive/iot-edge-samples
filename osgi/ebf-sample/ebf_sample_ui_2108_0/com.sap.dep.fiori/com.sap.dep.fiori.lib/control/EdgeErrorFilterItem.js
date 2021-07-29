jQuery.sap.declare("dep.fiori.lib.control.EdgeErrorFilterItem");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(FilterItem, Utilities) {
    FilterItem.extend("dep.fiori.lib.control.EdgeErrorFilterItem", {
        init: function() {
            this.setName("edgeErrors");
            this.setLabel(Utilities.geti18nGlobal("General.edgeErrors"));
            this.setControl(new sap.m.Select({
                selectedKey: "{filter>/EDGE_ERRORS}",
                items: [
                    new sap.ui.core.ListItem({
                        text: "",
                        key: ""
                    }),
                    new sap.ui.core.ListItem({
                        text: Utilities.geti18nGlobal("General.yes"),
                        key: "Y"
                    }),
                    new sap.ui.core.ListItem({
                        text: Utilities.geti18nGlobal("General.no"),
                        key: "N"
                    })
                ]
            }));
            FilterItem.prototype.init.apply(this, arguments);
        }
    });
}(sap.ui.comp.filterbar.FilterItem, dep.fiori.lib.util.Utilities));