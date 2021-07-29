jQuery.sap.declare("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");

(function(ControllerBase) {
    ControllerBase.extend("dep.fiori.lib.controller.DetailBlockControllerBase", {
        
        _aKey: [],
        _sBlockId: "",
        
        /**
         * onAfterRendering lifecycle method
         * 
         * Assumes setKey and setBlockId have been called
         */
        onAfterRendering: function() {
            this._mKey = this.getView().getModel(this.getKey());
            this.loadData(this.getKeyValue());
    
            var self = this;
            this.getView().getModel("events").setProperty("/" + this._sBlockId, function(oKey) {
                self.loadData(oKey);
            });
        },
        
        /**
         * Get key as string
         */
        getKey: function() {
            return this._aKey.join(";");
        },
        
        /**
         * Set the object key property (e.g. AUFNR)
         */
        setKey: function(aKey) {
            if (!Array.isArray(aKey)) {
                aKey = [ aKey ];
            }
            this._aKey = aKey;
        },
        
        /**
         * Get the block id
         */
        getBlockId: function() {
            return this._sBlockId;
        },
        
        /**
         * Set the block id
         */
        setBlockId: function(sBlockId) {
            this._sBlockId = sBlockId;
        },
        
        /**
         * Get the object key value
         */
        getKeyValue: function() {
            var oKey = this._mKey.getData();
            if (this._aKey.length === 1) {
                oKey = oKey[this._aKey[0]];
            }
            return oKey;
        },
        
        /**
         * Loads data specific to the block
         * 
         * Use this function to load any data that should only be 
         * loaded when the block is selected
         * 
         * Should override this function
         */
        loadData: function(oKey) {
            return;
        }
    
    });
}(dep.fiori.lib.controller.ControllerBase))