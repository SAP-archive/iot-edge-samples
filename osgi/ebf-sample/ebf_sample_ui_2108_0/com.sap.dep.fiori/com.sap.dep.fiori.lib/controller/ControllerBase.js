jQuery.sap.declare("dep.fiori.lib.controller.ControllerBase");

(function() {
    sap.ui.core.mvc.Controller.extend("dep.fiori.lib.controller.ControllerBase", {
        
        /**
         * Get i18n text
         */
        getText: function(sKey, aArgs) {
            this.mI18n = this.mI18n || this.getView().getModel("i18n") || this.getOwnerComponent().getModel("i18n");
            if (this.mI18n) {
                this.oI18n = this.oI18n || this.mI18n.getResourceBundle();
                if (this.oI18n) {
                    return this.oI18n.getText(sKey, aArgs);
                }
            }
            return "";
        }
    
    });
}());