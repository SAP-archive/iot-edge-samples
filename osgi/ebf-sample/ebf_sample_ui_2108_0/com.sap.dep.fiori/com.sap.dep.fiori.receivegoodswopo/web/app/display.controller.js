jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, SelectMaterialDialog, Utilities) {
    CreateControllerBase.extend("dep.fiori.receivegoodswopo.app.display", {
    	
    	_materialData : {
     		BWART  :  "501" ,
     		ERFME  :  "" ,
     		ERFMG  :  "" ,
     		LGORT  :  "" ,
     		MATNR  :  "" ,
     		TXZ01  :  "" ,
     		MEINS  :  "" ,
     		MENGE  :  "" ,
     		KOSTL  :  ""
    	},
    	
        onInit: function() {
            CreateControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mMaterials = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mMaterials, "material");
            
            var self = this;
            $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
        },
        
        onAddMaterial: function(oEvent) {
            var self = this;
            SelectMaterialDialog.getMaterial().done(function(aNewMaterials) {
                var aValid = [];
                
                if (aNewMaterials.length > 0) {
                    var oPromise = Utilities.showBusyIndicator($.Deferred());
                    self.addMaterials(aNewMaterials);
                }
            });
        },

        addMaterials: function(aNewMaterials) {
            var self = this;
            var aValid = [];
            var aInvalid = [];
            var aFailed = [];
            
            if (aNewMaterials.length > 0) {
                var oPromise = Utilities.showBusyIndicator($.Deferred());
                for (var i = 0; i < aNewMaterials.length; i++) {
                    var oMaterial = aNewMaterials[i];
                    sQuery = Utilities.getQueryString({
                        MATNR: oMaterial.MATNR,
                        LGORT: oMaterial.LGORT
                    });
                    sURL = "/ws_restful_data_controller/materials" + sQuery;

                    (function(oMaterial) {
                        $.ajax(sURL).done(function(aResponseData) {
                            if (aResponseData.length) {
                                aValid.push(aResponseData[0]);
                            } else {
                                aInvalid.push(oMaterial);
                            }
                            self.onMaterialAddComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                        }).fail(function() {
                            aFailed.push(oMaterial);
                            self.onMaterialAddComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                        });
                    })(oMaterial);
                }
            }
        },
        
        onMaterialAddComplete: function(oPromise, iNumMaterials, aValid, aInvalid, aFailed) {
            if (aValid.length + aInvalid.length + aFailed.length === iNumMaterials) {
                if (aFailed.length > 0) {
                    oPromise.reject();
                    this.selectMaterialError(this.getText("ToastMessage.CommunicationError"));
                } else {
                    if (aInvalid.length > 0) {
                        var sMaterials = aInvalid.map(function(oMaterial) { return oMaterial.MATNR; }).join(",");
                        this.selectMaterialError(this.getText("ToastMessage.MissingMaterial", sMaterials));
                    }
                    var aMaterials = this.mMaterials.getData();
                    aMaterials.push.apply(aMaterials, aValid);
                    this.mMaterials.refresh();
                    oPromise.resolve();
                }
            }
        },

        selectMaterialError: function(sText) {
            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(sText, {
                title: Utilities.geti18nGlobal("General.error"),
                icon: sap.m.MessageBox.Icon.ERROR,
                actions: [
                    sap.m.MessageBox.Action.RETRY,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === "RETRY") {
                        self.onAddMaterial();
                    }
                }
            });
        },

        onRemoveMaterial: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var sIndex = oListItem.getBindingContext("material").getPath().substring(1);
            var aMaterials = this.mMaterials.getData();
            aMaterials.splice(sIndex, 1);
            this.mMaterials.refresh();
        },

        onReceive: function() {
            var aItems = this.mMaterials.getData();
            var aRequestItems = [];
            
            var self = this;

            var bValid = true;
            for (var i = 0; i < aItems.length; i++) {
            	
            	 var oMaterial = $.extend(true, {}, self._materialData);
            	
            	 if (!aItems[i].ERFMG || aItems[i].ERFMG < 1) {
            	     bValid = false;
                     break;
                 }
            	 oMaterial.ERFME = aItems[i].MEINS;
            	 oMaterial.MEINS = aItems[i].MEINS;
            	 oMaterial.LGORT = aItems[i].LGORT;
            	 oMaterial.ERFMG = aItems[i].ERFMG;
            	 oMaterial.MATNR = aItems[i].MATNR;
            	 oMaterial.TXZ01 = aItems[i].MAKTX;
            	 oMaterial.MENGE = aItems[i].ERFMG;

                 aRequestItems.push(oMaterial);
            }
            
            if (!bValid) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.show(this.getText("ToastMessage.InvalidQuantity"), {
                    title: Utilities.geti18nGlobal("General.error"),
                    icon: sap.m.MessageBox.Icon.ERROR,
                    actions: [
                        sap.m.MessageBox.Action.OK
                    ]
                });
                return;
            }

            var oRequestBody = {
                MJAHR: new Date().getFullYear(),
                BLDAT: Utilities.date.currDateFormatted(),
                BUDAT: Utilities.date.currDateFormatted(),
                GoodsReceiptArr: aRequestItems
            };

            var sURL = "/ws_restful_data_controller/goods_receipt_wo_po";
            var oPromise = Utilities.showBusyIndicator($.Deferred());

            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: sURL,
                method: "POST",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    oPromise.reject();
                } else {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("ToastMessage.TransferSuccess"), {
                        title: Utilities.geti18nGlobal("General.success"),
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        actions: [
                            sap.m.MessageBox.Action.OK
                        ],
                        onClose: function(sAction) {
                            self.resetForm();
                        }
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                oPromise.reject();
            }));

            return oPromise;
        },
        
        resetForm: function() {
            this.mMaterials.setData([]);
        },
        
        navBack: function() {
            Utilities.navHome();
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.SelectMaterialDialog, dep.fiori.lib.util.Utilities));