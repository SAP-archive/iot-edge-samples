jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.SelectPRMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, DataAccess, SelectPRMaterialDialog, Utilities) {
    CreateControllerBase.extend("dep.fiori.purchasereq.app.create", {
        
        onInit: function() {
            CreateControllerBase.prototype.onInit.apply(this, arguments);
            
            this.getObjectModel().setData({ TDTXT: "", PRItemArray: [] });
            
           /* DataAccess.getLookupModel({
                freightMode: "freight_modes"
            }).done(function(mLookup) {
                this.getView().setModel(mLookup, "lookup");
            }.bind(this));*/
            
            this.mError = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mError, "error");
            
            this.mWarning = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mWarning, "warning");
        },
    
        onExit: function() {
            sap.ushell.Container.setDirtyFlag(false);
        },
    
        onDescriptionChange: function() {
            sap.ushell.Container.setDirtyFlag(true);
        },
    
        onAddMaterial: function(oEvent) {
            SelectPRMaterialDialog.getMaterial().done(function(aMaterials, aWarnings) {
                for (var i = 0; i < aMaterials.length; i++) {
                    this.getObjectModel().getProperty("/PRItemArray").push(Object.assign(aMaterials[i], {
                        MENGE: aMaterials[i].REQQTY,
                        TXZ01: aMaterials[i].MAKTX,
                        FREIGHT_MODE: " "
                    }));
                }
                this.getObjectModel().refresh(true);
                sap.ushell.Container.setDirtyFlag(this.getObjectModel().getProperty("/PRItemArray").length > 0);
                
                this.mWarning.setData(aWarnings);
            }.bind(this));
        },
        
        onRemoveMaterial: function(oEvent) {
            var sMATNR = oEvent.getParameter("listItem").getBindingContext().getObject().MATNR;
            var aPRItems = this.getObjectModel().getProperty("/PRItemArray");
            
            for (var i = 0; i < aPRItems.length; i++) {
                if (aPRItems[i].MATNR === sMATNR) {
                    aPRItems.splice(i, 1);
                    break;
                }
            }
            this.getObjectModel().refresh(true);
        },
    
        onSearch: function(oEvent) {
            var sSearch = oEvent.getParameter("newValue");
            var oBinding = this.getView().byId("prMaterialList").getBinding("items");
            var oFilter = new sap.ui.model.Filter("TXZ01", sap.ui.model.FilterOperator.Contains, sSearch);
            oBinding.filter(oFilter);
        },
        
        onMaterialIconPress: function(oEvent) {
            var oIcon = oEvent.getSource();
            var oContext = oIcon.getBindingContext();
            var oMaterial = oContext.getModel().getProperty(oContext.getPath());
            
            var aErrors = this.mError.getProperty("/" + oMaterial.MATNR) || [];
            var aWarnings = this.mWarning.getProperty("/" + oMaterial.MATNR) || [];
            var aData = aErrors.length > 0 ? aErrors : aWarnings;
            
            if (!this.oMaterialWarning) {
                this.oMaterialWarning = sap.ui.xmlfragment("dep.fiori.lib.frag.selectPRMaterialWarning", this);
                this.oMaterialWarning.setModel(new sap.ui.model.json.JSONModel());
                this.getView().addDependent(this.oMaterialWarning);
            }
            this.oMaterialWarning.getModel().setData(aData);
            this.oMaterialWarning.openBy(oIcon);
        },
    
        onSave: function() {
            var self = this;
            if (this.validateMaterials()) {
                var aMaterials = this.getObjectModel().getProperty("/PRItemArray");
                var sBNFPO = "00000";
                for (var i = 0; i < aMaterials.length; i++) {
                    aMaterials[i].IS_CHANGED = "I";
                    aMaterials[i].BNFPO = String(sBNFPO + (i + 1)).slice(-1 * sBNFPO.length);
                }
                
                this.postPurchaseRequisition().done(function(oResponseData) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.PRSaveSuccess", oResponseData.OBJECT_KEY), {
                        closeOnBrowserNavigation: false
                    });
    
                    sap.ushell.Container.setDirtyFlag(false);
                    self.getRouter().navTo("detail", {
                        PR_NO_LOCAL: oResponseData.OBJECT_KEY
                    }, true);
                }).fail(function(aResponseData) {
                    if (aResponseData) {
                        var oErrors = {};
                        for (var i = 0; i < aResponseData.length; i++) {
                            oErrors[aResponseData[i].MATNR] = oErrors[aResponseData[i].MATNR] || [];
                            oErrors[aResponseData[i].MATNR].push(aResponseData[i]);
                        }
                        self.mError.setData(oErrors);
                        sap.m.MessageToast.show(self.getText("ToastMessage.Error"));
                    } else {
                        sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
                    }
                });
            } else {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.formIncomplete"));
            }
        },
        
        validateMaterials: function() {
            var bValid = true;
            var aItems = this.getObjectModel().getProperty("/PRItemArray");
            for (var i = 0; i < aItems.length; i++) {
                if (!aItems[i].MENGE || !aItems[i].LFDAT) {
                    bValid = false;
                    break;
                }
            }
            return bValid;
        },
        
        postPurchaseRequisition: function() {
            var oDeferred = $.Deferred();
            Utilities.showBusyIndicator($.ajax({
                url: "/dep/odata",
                data: JSON.stringify([ this.getObjectModel().getData() ]),
                method: "POST",
                headers: {
                    "REQUEST_OBJECT": "PURCHASE_REQUISITIONS"
                }
            }).done(function(aResponseData, errorText, errorThrown) {
                aResponseData = jQuery.parseJSON(aResponseData);
                if (aResponseData[0].STATUS === "200") {
                    oDeferred.resolve(aResponseData[0]);
                } else {
                    oDeferred.reject(aResponseData);
                }
            }).fail(function() {
                oDeferred.reject();
            }));
            return oDeferred.promise();
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectPRMaterialDialog, dep.fiori.lib.util.Utilities));