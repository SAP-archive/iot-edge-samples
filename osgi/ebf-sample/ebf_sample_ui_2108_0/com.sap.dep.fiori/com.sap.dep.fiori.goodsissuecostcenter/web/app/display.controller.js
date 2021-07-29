jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, SelectGenericDialog, SelectMaterialDialog, Utilities) {
    CreateControllerBase.extend("dep.fiori.goodsissuecostcenter.app.display", {
    	
    	 _materialData : {
         		BWART  :  "201" ,
         		ERFME  :  "" ,
         		ERFMG  :  "" ,
         		LGORT  :  "" ,
         		MATNR  :  "" ,
         		MAKTX  :  "" ,
         		MEINS  :  "" ,
         		MENGE  :  "" ,
         		KOSTL  :  ""
         },

    	 
        onInit: function() {
            CreateControllerBase.prototype.onInit.apply(this, arguments);
            
			var self = this;        	            
            self.mMaterials = new sap.ui.model.json.JSONModel([]);
            self.getView().setModel(this.mMaterials, "material");
            
            self.mCostCenter = new sap.ui.model.json.JSONModel([]);
            self.getView().setModel(this.mCostCenter, "costcenter");
            
            $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
        },

        onCostCenterValueHelp: function(oEvent) {
            var self = this;
            SelectGenericDialog.getEntity({
                sEntityPath: "/CostCenter",
                aColumns: [
                    { sHeader: this.getText("CostCenterSelect.controllingArea"), sField: "KOKRS" },
                    { sHeader: this.getText("CostCenterSelect.costCenter"), sField: "KOSTL" },
                    { sHeader: this.getText("CostCenterSelect.validToDate"), sField: "DATBI" }
                ]
            }).done(function(oObject) {
                self.mCostCenter.setProperty("/", oObject);
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
                title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.error"),
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
        
        onSave: function() {
        	var self = this;
        	
        	if(!self.mCostCenter.getData().KOSTL){
        		sap.m.MessageToast.show(self.getText(("ToastMessage.InvalidCostCenter")));
        		return;
        	}
            var aItems = this.mMaterials.getData();
            var aRequestItems = [];
            
            var bValid = true;
            for (var i = 0; i < aItems.length; i++) {
            	
            	 var oMaterial =  $.extend(true, {}, self._materialData);
            	 
            	 if (!aItems[i].ERFMG || aItems[i].ERFMG < 1 || aItems[i].ERFMG > aItems[i].QUANT) {
            	     bValid = false;
                     break;
                 }
            	 oMaterial.ERFME = aItems[i].MEINS;
            	 oMaterial.MEINS = aItems[i].MEINS;
            	 oMaterial.LGORT = aItems[i].LGORT;
            	 oMaterial.ERFMG = aItems[i].ERFMG;
            	 oMaterial.MATNR = aItems[i].MATNR;
            	 oMaterial.MAKTX = aItems[i].MAKTX;
            	 oMaterial.MENGE = aItems[i].ERFMG;

            	 oMaterial.KOSTL = self.mCostCenter.getData().KOSTL;

                aRequestItems.push(oMaterial);
            }
            
            if (!bValid) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.show(this.getText("ToastMessage.InvalidQuantity"), {
                    title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.error"),
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
                GoodsToIssueArr: aRequestItems
            };

            var sURL = "/ws_restful_data_controller/costcenter_goods_issue";
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
                    sap.m.MessageBox.show(self.getText("ToastMessage.GoodsIssueSuccess"), {
                        title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.success"),
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
            this.mCostCenter.setData({});
        },
        
        navBack: function() {
            Utilities.navHome();
        }
        
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.SelectMaterialDialog, dep.fiori.lib.util.Utilities));