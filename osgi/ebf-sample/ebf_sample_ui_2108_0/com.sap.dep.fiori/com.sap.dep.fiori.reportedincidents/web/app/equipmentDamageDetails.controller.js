jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("sap.m.MessageBox");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.equipmentDamageDetails", {	

    onInit: function () {
    	this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		CreateControllerBase.prototype.onInit.apply(this, arguments);
		this.mInvolvedEquipmentDamage = this.getObjectModel();
		this.loadDamageTypeList();
		this.mDamageTypeList = new sap.ui.model.json.JSONModel();
		this.getView().setModel(this.mDamageTypeList, "EQUIPMENT_DAMAGE_TYPE");	
		
    },    
    onRouteMatched: function (oEvent) {
        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        if (oEvent.getParameter("name") === "equipmentDamageDetails") {
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;
            this.asset_id = oEvent.getParameters().arguments.ASSET_ID;
			this.asset_type = oEvent.getParameters().arguments.ASSET_TYPE;
			this.asset_line_number = oEvent.getParameters().arguments.ASSET_LINE_NO;
			console.log("asset line:" + this.asset_line_number);
			this.asset_damage_line_number = oEvent.getParameters().arguments.ASSET_DAMAGE_LINE_NO;
			console.log("damage asset line:" + this.asset_damage_line_number);
            if (this.id_local) {
                this.loadEquipmentDamageDetails(this.asset_damage_line_number, this.asset_id, this.asset_type, this.id_local);
				this.loadEquipmentSelectedDamage(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);
                this.onInitAfterRoute();
            }
        } 
    },

    getRouter: function() {
        return this.oRouter;
    },

    setRouter: function(oRouter) {
        this.oRouter = oRouter;
    },
	   
    onInitAfterRoute: function() {       
		this.mState = new sap.ui.model.json.JSONModel({ editing: false });
        this.getView().setModel(this.mState, "state");	
        this.mEquipmentDamageDetails = new sap.ui.model.json.JSONModel();		
		this.getView().setModel(this.mEquipmentDamageDetails, "INVOLVED_EQUIPMENT_DAMAGE_DETAILS");
		this.mEquipmentSelected = new sap.ui.model.json.JSONModel();
		this.getView().setModel(this.mEquipmentSelected, "INVOLVED_EQUIPMENT_SELECTED");
    },

    loadEquipmentDamageDetails: function(asset_damage_line_number, asset_id, asset_type, id_local){
        var self = this;
        this.oModel.read("/Asset_Damage(" + "ASSET_DAMAGE_LINE_NO='" + asset_damage_line_number + "',ASSET_ID='" + asset_id + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {
                context: null,
                success: function(oResponseData, response) {
                  self.mEquipmentDamageDetails.setData(oResponseData);
                }
            });	
    },
	
    loadEquipmentSelectedDamage: function(asset_id, asset_line_number, asset_type, id_local){
        var self = this;
		if (asset_type == 001) {
		self.oModel.read("/Incident_Involved_Equipment(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {	
                context: null,
                success: function(oResponseData, response) {
				   self.mEquipmentSelected.setData(oResponseData);
                }
            });
		}
		else if (asset_type == 002) {
			self.oModel.read("/Incident_Involved_Vehicle(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {	               
                context: null,
                success: function(oResponseData, response) {
				   self.mEquipmentSelected.setData(oResponseData);
                }
            });
		}
		else if (asset_type == 003) {
			self.oModel.read("/Incident_Involved_Property(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {	
                context: null,
                success: function(oResponseData, response) {
				   self.mEquipmentSelected.setData(oResponseData);
                }
            });
		}
			
    },	
    onEquipmentDamageEdit: function(oEvent) {
		this.mState.setProperty("/editing", true);
    },

	onEquipmentDamageCancel: function(oEvent) {
		this.mState.setProperty("/editing", false);
		this.loadEquipmentDamageDetails(this.asset_damage_line_number, this.asset_id, this.asset_type, this.id_local);
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
		this.mEquipmentDamageDetails.setProperty("/DAMAGE_TYPE", damageTypeValue);
		this.mEquipmentDamageDetails.setProperty("/ASSET_DAMAGE_DESC", damageTypeDescValue);
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
	navToAssetList: function(){
		var self = this;
		var sHash = "#depIncident-list&/edit/" + self.id_local;
		Utilities.navToExternal(sHash);
	},
	navToAssetDetails: function(){
		var self = this;
		var assetIDValue = this.getView().byId("assetID").getValue();
		var assetTypeValue = self.getView().byId("assetType").getValue();
		var assetLineValue = this.getView().byId("assetLine").getValue();
		if(assetTypeValue == 001) {				
			var sHash = "#depIncident-list&/equipmentDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
			Utilities.navToExternal(sHash);
		}
		else if(assetTypeValue == 002) {				
			var sHash = "#depIncident-list&/vehicleDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
			Utilities.navToExternal(sHash);
		}
		else if(assetTypeValue == 003) {				
			var sHash = "#depIncident-list&/propertyDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
			Utilities.navToExternal(sHash);
		}
		else {
			var sHash = "#depIncident-list&/edit/" + self.id_local;
			Utilities.navToExternal(sHash);
		}
	},
    onEquipmentDamageSave: function(oEvent) {
            var assetIDValue = this.getView().byId("assetID").getValue();
			var assetTypeValue = this.getView().byId("assetType").getValue();
			var assetDamageLineValue = this.getView().byId("assetDamageLine").getValue();
			var assetLineValue = this.getView().byId("assetLine").getValue();
			var damageDescValue = this.getView().byId("damageDesc").getValue();
			var damageTypeValue = this.getView().byId("damageType").getValue();
 						  			
			var oRequestData = Object.assign({
				ASSET_ID: assetIDValue,
				ASSET_TYPE: assetTypeValue,
                ASSET_DAMAGE_DESC: damageDescValue,
                DAMAGE_TYPE:  damageTypeValue,
                ASSET_DAMAGE_LINE_NO: assetDamageLineValue 
            }, this.mInvolvedEquipmentDamage.getData());
			var self = this;
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: self.id_local},
                url: "/ws_restful_ehs_data_controller/ASSET_DAMAGE",
                method: "POST",
			   data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("Toast.otherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("Toast.updateEquipmentDamageSuccess"), {
                        closeOnBrowserNavigation: false
                    });
					self.mState.setProperty("/editing", false);
					sap.ushell.Container.setDirtyFlag(false);
                    if(assetTypeValue == 001) {				
						var sHash = "#depIncident-list&/equipmentDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
						Utilities.navToExternal(sHash);
					}
					else if(assetTypeValue == 002) {				
						var sHash = "#depIncident-list&/vehicleDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
						Utilities.navToExternal(sHash);
					}
					else if(assetTypeValue == 003) {				
						var sHash = "#depIncident-list&/propertyDetails/" + self.id_local + "/" + assetTypeValue + "/" + assetIDValue + "/" + assetLineValue;
						Utilities.navToExternal(sHash);
					}
					else {
						var sHash = "#depIncident-list&/edit/" + self.id_local;
						Utilities.navToExternal(sHash);
					}
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("Toast.communicationError"));
            }));
        },
   
    formatters : {
        damageListTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("AssetDamages.count", [itemCount]);
            }
            return null;
        }
    }
});
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.ErrorPopover));