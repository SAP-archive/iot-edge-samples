jQuery.sap.setObject("dep.fiori.lib.util.ErrorPopover", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ErrorPopover, Utilities) {
    // Assign all these functions to the main object without overwriting
    Object.assign(ErrorPopover, {
        getPopover: function() {
            if (!this._oPopover) {
                this._oPopover = sap.ui.xmlfragment("dep.fiori.lib.frag.errorPopover", this);
                this._oPopover.setModel(new sap.ui.model.json.JSONModel());
                this._oPopover.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
            }

            return this._oPopover;
        },

        toError: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext();
            var sTRANSID = oContext.getModel().getProperty(oContext.getPath());

            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "depTransaction-display&/" + sTRANSID
                }
            });
        },

        openBy: function(oControl, aTransactions) {
            var oPopover = this.getPopover();
            oPopover.getModel().setData(aTransactions);
            oPopover.openBy(oControl);
        },

        close: function(oEvent) {
            var oPopover = this.getPopover();
            oPopover.getModel().setData([]);
            oPopover.close();
        },
    });
}(dep.fiori.lib.util.ErrorPopover, dep.fiori.lib.util.Utilities));