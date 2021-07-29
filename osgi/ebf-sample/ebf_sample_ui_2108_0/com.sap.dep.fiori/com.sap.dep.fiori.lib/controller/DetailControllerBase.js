jQuery.sap.declare("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");

(function(ControllerBase) {
    ControllerBase.extend("dep.fiori.lib.controller.DetailControllerBase", {
        
        _aKey: [],
        _sSelectedBlock: "",
        _sPageLayoutId: "content",
        _sListRoute: "display",
        _sDetailRoute: "detail",

        /**
         * onInit lifecycle method
         *
         * Assumes setKey has been called
         */
        onInit: function() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            // Models used to pass data between detail and block controllers

            // Used for each block to register an "onNavTo" callback
            this._mEvents = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this._mEvents, "events");

            // Used to share router
            this._mRouter = new sap.ui.model.json.JSONModel(this._oRouter);
            this.getView().setModel(this._mRouter, "router");

            // Used to share object key
            this._mKey = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this._mKey, this.getKey());
        },

        /**
         * Get the object key property (e.g. AUFNR)
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
         * Get the selected block id
         */
        getSelectedBlock: function() {
            return this._sSelectedBlock;
        },

        /**
         * Set the selected block id
         */
        setSelectedBlock: function(sSelectedBlock) {
            this._sSelectedBlock = sSelectedBlock;
        },

        /**
         * Get the ObjectPageLayout control
         */
        getPageLayout: function() {
            if (!this._oPageLayout) {
                this._oPageLayout = this.getView().byId(this._sPageLayoutId);
            }
            return this._oPageLayout;
        },

        /**
         * Set the ObjectPageLayout control
         */
        setPageLayout: function(oPageLayout) {
            this._oPageLayout = oPageLayout;
        },
        
        /**
         * Get the list route name
         */
        getListRoute: function() {
            return this._sListRoute;
        },

        /**
         * Set the list route name
         */
        setListRoute: function(sListRoute) {
            this._sListRoute = sListRoute;
        },

        /**
         * Set the detail route name
         */
        setDetailRoute: function(sDetailRoute) {
            this._sDetailRoute = sDetailRoute;
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
         * Get router
         */
        getRouter: function() {
            return this._oRouter;
        },

        /**
         * Block select event handler
         *
         * Updates the URL when a block is selected
         */
        onBlockSelect: function(oEvent) {
            var sId = oEvent.getParameter("section").getId()
            sId = sId.replace(this.getView().createId(""), "");
            this.setSelectedBlock(sId);

            var oNavArgs = { block: sId };
            Object.assign(oNavArgs, this._mKey.getData());
            this._oRouter.navTo("detail", oNavArgs, true);
        },

        /**
         * Route matched event handler
         *
         * Selects the appropriate section and loads required data
         */
        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === this._sDetailRoute) {
                var oNavArgs = oEvent.getParameter("arguments");
                var oPrevKey = this._mKey.getData();
                var oCurrKey = {};
                var bKeyChange = false;
                for (var i = 0; i < this._aKey.length; i++) {
                    var sProp = this._aKey[i];
                    oCurrKey[sProp] = oNavArgs[sProp];
                    bKeyChange = bKeyChange || oCurrKey[sProp] !== oPrevKey[sProp];
                }
                this._mKey.setData(oCurrKey);

                // Update the selected section
                if (oNavArgs.block && oNavArgs.block !== this.getSelectedBlock()) {
                    this.setSelectedBlock(oNavArgs.block);
                    var oBlock = this.getView().byId(oNavArgs.block);
                    if (oBlock) {
                        this.getPageLayout().setSelectedSection(oBlock.getId());
                    }
                }

                // Check if a reload is necessary
                if (bKeyChange) {
                    oCurrKey = this.getKeyValue();
                    // Load generic data
                    this.loadData(oCurrKey);
                    // Load block specific data
                    var sSelectedBlockId = this.getPageLayout().getSelectedSection();
                    this.loadBlockData(sSelectedBlockId, oCurrKey);
                }
            }
        },

        /**
         * Loads data for the specified block
         *
         * Used to lazy load data for a particular section
         */
        loadBlockData: function(sBlockId, oKey) {
            var oNavEvents = this._mEvents.getData();
            for (var sId in oNavEvents) {
                if (this.getView().byId(sId) && this.getView().byId(sId).getId() === sBlockId) {
                    oNavEvents[sId](oKey);
                }
            }
        },

        /**
         * Loads generic data for the page
         *
         * Use this function for any data that is loaded whenever
         * route is matched, regardless of selected section
         *
         * Should override this function
         */
        loadData: function(oKey) {
            return;
        },

        /**
         * Cancel event handler
         *
         * Can override if needed
         */
        onCancel: function() {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash) {
                window.history.go(-1);
            } else {
                this._oRouter.navTo(this.getListRoute(), {}, true);
            }
        }

    });
}(dep.fiori.lib.controller.ControllerBase));