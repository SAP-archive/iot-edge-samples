jQuery.sap.declare("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ControllerBase, DataAccess, Utilities) {
    ControllerBase.extend("dep.fiori.lib.controller.CreateControllerBase", {
        
        _sODataUrl: "/dep/odata",
        _sFormId: "form",
        _sListRoute: "display",
        
        /**
         * onInit lifecycle method
         */
        onInit: function() {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
            
            this._mOData = DataAccess.getODataModel(this.getODataServiceUrl());
            this.getView().setModel(this._mOData, "odata");
            
            this._mObject = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this._mObject);
            
            this._mCreatedByImg = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this._mCreatedByImg, "createdByImg");
            var self = this;
            Utilities.getUserImage().done(function(oResponseData) {
                self._mCreatedByImg.setData(oResponseData);
                self._mCreatedByImg.setProperty("/name", sap.ushell.Container.getUser().getFullName());
            });
        },
        
        /**
         * Get OData service url
         */
        getODataServiceUrl: function() {
            return this._sODataUrl;
        },
        
        /**
         * Set OData service url
         */
        setODataServiceUrl: function(sUrl) {
            this._sODataUrl = sUrl;
        },
        
        /**
         * Get model for object being created
         */
        getObjectModel: function() {
            return this._mObject;
        },
        
        /**
         * Get create form
         */
        getForm: function() {
            if (!this._oForm) {
                this._oForm = this.byId(this._sFormId);
            }
            return this._oForm;
        },
        
        /**
         * Set create form
         */
        setForm: function(oForm) {
            this._oForm = oForm;
        },
        
        /**
         * Set the list route name
         */
        setListRoute: function(sListRoute) {
            this._sListRoute = sListRoute;
        },
        
        /**
         * Get router
         */
        getRouter: function() {
            return this._oRouter;
        },
        
        /**
         * Get required form fields
         */
        getRequiredFields: function() {
            var aRequiredFields = [];
            var aFormContainers = this.getForm().getFormContainers();
            for (var i = 0; i < aFormContainers.length; i++) {
                var aFormElements = aFormContainers[i].getFormElements();
                for (var j = 0; j < aFormElements.length; j++) {
                    var oElement = aFormElements[j];
                    if (oElement.getVisible() && oElement.getLabel().getRequired()) {
                        aRequiredFields = aRequiredFields.concat(oElement.getFields());
                    }
                }
            }
            return aRequiredFields;
        },

        /**
         * Validate required fields
         */
        validateRequiredFields: function() {
            var bValid = true;
            var aRequiredFields = this.getRequiredFields();
            for (var i = 0; i < aRequiredFields.length; i++) {
                if (aRequiredFields[i].getValue) {
                    if (aRequiredFields[i].getValue()) {
                        aRequiredFields[i].setValueState(sap.ui.core.ValueState.None);
                    } else {
                        aRequiredFields[i].setValueState(sap.ui.core.ValueState.Error);
                        bValid = false;
                    }
                } else if (aRequiredFields[i].getSelectedKey) {
                    if (aRequiredFields[i].getSelectedKey()) {
                        aRequiredFields[i].setValueState(sap.ui.core.ValueState.None);
                    } else {
                        aRequiredFields[i].setValueState(sap.ui.core.ValueState.Error);
                        bValid = false;
                    }
                }
            }
            if (!bValid) {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.formIncomplete"));
            }
            return bValid;
        },
        
        /**
         * Reset form fields
         */
        resetForm: function() {
            if (this.getForm()) {
                var aFormContainers = this.getForm().getFormContainers();
                for (var i = 0; i < aFormContainers.length; i++) {
                    var aFormElements = aFormContainers[i].getFormElements();
                    for (var j = 0; j < aFormElements.length; j++) {
                        var aFields = aFormElements[j].getFields();
                        for (var k = 0; k < aFields.length; k++) {
                        	if(aFields[k].mProperties.type != undefined){
                        		aFields[k].setValueState(sap.ui.core.ValueState.None);
                        	}
                        }
                    }
                }
            }
            this.resetModelData();
        },
        
        /**
         * Reset model data
         */
        resetModelData: function() {
            this.getObjectModel().setData({});
        },
        
        /**
         * Cancel event handler
         * 
         * Can override if needed
         */
        onCancel: function(oEvent) {
            this.resetForm();
            
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash) {
                window.history.go(-1);
            } else {
                this.navBack();
            }
        },
        
        /**
         * Nav back
         * 
         * Can override if needed
         */
        navBack: function() {
            this._oRouter.navTo(this._sListRoute, {}, true);
        },
        
        /**
         * Route matched event handler
         * 
         * Can override if needed
         */
        onRouteMatched: function(oEvent) {
            return;
        }
        
    });
}(dep.fiori.lib.controller.ControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Utilities));