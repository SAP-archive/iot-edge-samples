jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.createEquipmentDamage", {
        onInit: function() {
        var incidentID = {};
		var assetID = {};
		var assetType = {};
		var assetDamageLineNumber = {};
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("createEquipmentDamage").attachMatched(this._onRouteMatched);
        CreateControllerBase.prototype.onInit.apply(this, arguments);
        this.mEquipmentDamage = this.getObjectModel();
        this.loadDamageTypeList();
		this.mDamageTypeList = new sap.ui.model.json.JSONModel();
		this.getView().setModel(this.mDamageTypeList, "EQUIPMENT_DAMAGE_TYPE");	
        },
        
        _onRouteMatched : function(oEvent) {
			oArgs = oEvent.getParameter("arguments");
			incidentID = oArgs.ID_LOCAL;
			assetID = oArgs.ASSET_ID;
			assetType = oArgs.ASSET_TYPE;
			assetLineNumber = oArgs.ASSET_LINE_NO;
		},
		loadDamageTypeList: function() {
			var self = this;
			$.ajax("/ws_restful_ehs_data_controller/DAMAGE_TYPE").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mDamageTypeList.setData(aResponseData);
			});	
		},
		damageTypeLookupPress: function(){
			var dialog = this.getDamageTypeDialog();
			dialog.open();
		},
      
		getDamageTypeDialog: function () {
			if (!this.damageTypeDialog) {
				this.damageTypeDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.damageType", this);
				this.damageTypeDialog.setModel(this.mDamageTypeList);
				this.getView().addDependent(this.damageTypeDialog);
			}
			return this.damageTypeDialog;
		},

		damageTypeDialogCancel: function(){
			this.getDamageTypeDialog().close();
		},

		onDamageTypeSelect: function (oEvent){
			var damageTypeValue= oEvent.getSource().getBindingContext().getObject().DAMAGE_TYPE;
			var damageTypeDescValue = oEvent.getSource().getBindingContext().getObject().DAMAGE_TYPE_DESC;			
			this.mDamageTypeList.setProperty("/DAMAGE_TYPE", damageTypeValue);
			this.mDamageTypeList.setProperty("/DAMAGE_TYPE_DESC", damageTypeDescValue);
			this.damageTypeDialogCancel();
		},

		damageTypeFilter: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("DAMAGE_TYPE", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			//var binding = sap.ui.getCore().byId("damageTypeTable").getBinding("items");
			var binding = this.damageTypeDialog.getContent()[1].getBinding("items");
			binding.filter(aFilters, "Application");
		},
				
        damageTypeSave: function(oEvent) {
			var i18n = this.getView().getModel("i18n");
        	var self=this;
			var currentAssetID = assetID;
			var currentAssetType = assetType;
			var currentAssetLineNumber = assetLineNumber;
            var damageTypeValue = this.getView().byId("damageType").getValue();
			var assetDamageDescValue = this.getView().byId("damageDesc").getValue();
			//var currentAssetType = "001";			
			this.mEquipmentDamage.setProperty("/ASSET_ID", currentAssetID);
			this.mEquipmentDamage.setProperty("/ASSET_LINE_NO", currentAssetLineNumber);
			this.mEquipmentDamage.setProperty("/ASSET_TYPE", currentAssetType);
			this.mEquipmentDamage.setProperty("/ASSET_DAMAGE_DESC", assetDamageDescValue);
			this.mEquipmentDamage.setProperty("/DAMAGE_TYPE", damageTypeValue);
			
			var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR2"));
                return;
            }			
			var localID = incidentID;
			
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: localID},
                url: "/ws_restful_ehs_data_controller/ASSET_DAMAGE",
                method: "POST",
                data: JSON.stringify([ this.mEquipmentDamage.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                } else if (oResponseData.STATUS === "409") {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("ToastMessage.createDuplicate"), {
                        title: self.getText("Dialog.success"),
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        actions: [
                            sap.m.MessageBox.Action.YES,
                            sap.m.MessageBox.Action.NO
                        ],
                        onClose: function(sAction) {
                            if (sAction === "YES") {
                                self.getOwnerComponent().getRouter().navTo("equipmentDetails", {
                        		ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAsset, ASSET_LINE_NO: currentAssetLineNumber
                   				 });
                            }
                        }
                    });
                } else {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.createEquipmentDamageSuccess"), {
                        closeOnBrowserNavigation: true
                    });
					self.getView().byId("damageType").setValue("");
					self.getView().byId("damageDesc").setValue("");
					console.log("current asset type id:" + currentAssetType);
					var navView;
					if (currentAssetType == 001) {
					self.getOwnerComponent().getRouter().navTo("equipmentDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					else if (currentAssetType == 002) {
						self.getOwnerComponent().getRouter().navTo("vehicleDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					else if (currentAssetType == 003) {
						self.getOwnerComponent().getRouter().navTo("propertyDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					else {
						self.getOwnerComponent().getRouter().navTo("edit", {
							ID_LOCAL: localID
						});
					}
					/*
					if (currentAssetType == '001') {
						self.getOwnerComponent().getRouter().navTo("equipmentDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					if (currentAssetType == '002') {
						self.getOwnerComponent().getRouter().navTo("vehicleDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					if (currentAssetType == '003') {
						self.getOwnerComponent().getRouter().navTo("propertyDetails", {
							ID_LOCAL: localID, ASSET_TYPE: currentAssetType, ASSET_ID: currentAssetID, ASSET_LINE_NO: currentAssetLineNumber
						});
					}
					else {
						self.getOwnerComponent().getRouter().navTo("edit", {
							ID_LOCAL: localID
						});
					} */
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities));