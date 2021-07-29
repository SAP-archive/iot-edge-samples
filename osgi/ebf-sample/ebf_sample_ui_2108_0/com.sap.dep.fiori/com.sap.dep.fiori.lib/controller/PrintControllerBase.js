jQuery.sap.declare("dep.fiori.lib.controller.PrintControllerBase");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");

(function(ControllerBase) {
    ControllerBase.extend("dep.fiori.lib.controller.PrintControllerBase", {

        /**
         * Load and display data for printing
         */
        loadData: function(aId, oFragment) {
            var oDeferred = $.Deferred();
            
            this.loadObjectData.apply(this, aId).done(function(oData) {
                oFragment.setModel(new sap.ui.model.json.JSONModel(oData));
                oFragment.addEventDelegate({ onAfterRendering: oDeferred.resolve });
            });
            
            return oDeferred.promise();
        },
        
        /**
         * Load data for object
         * 
         * Should override
         */
        loadObjectData: function() {
            return $.Deferred().resolve({});
        }
        
    });
}(dep.fiori.lib.controller.ControllerBase));