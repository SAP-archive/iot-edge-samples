jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("sap.m.MessageBox");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.propertyDetails", {	

    onInit: function () {
    	this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		CreateControllerBase.prototype.onInit.apply(this, arguments);	
		this.mInvolvedProperty = this.getObjectModel();
		this.mEquipmentList = new sap.ui.model.json.JSONModel();
		//this.loadEquipmentList();
		this.mEquipmentTypeList = new sap.ui.model.json.JSONModel();
		this.loadEquipmentTypeList();
    },    
    onRouteMatched: function (oEvent) {
        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        if (oEvent.getParameter("name") === "propertyDetails") {
            this.asset_id = oEvent.getParameters().arguments.ASSET_ID;
			this.asset_line_number = oEvent.getParameters().arguments.ASSET_LINE_NO;
			this.asset_type = oEvent.getParameters().arguments.ASSET_TYPE;
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;			
            if (this.id_local) {
                this.loadPropertyDetails(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);
				this.loadEquipmentDamages(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);
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
		//this.getView().setModel(this.mEquipmentList, "EQUIPMENT_DETAILS");		
        this.mPropertyDetails = new sap.ui.model.json.JSONModel();		
		this.getView().setModel(this.mPropertyDetails, "INVOLVED_PROPERTY_DETAILS");
		this.mEquipmentDamages = new sap.ui.model.json.JSONModel();		
		this.getView().setModel(this.mEquipmentDamages, "INVOLVED_EQUIPMENT_DAMAGES");
    },

    loadPropertyDetails: function(asset_id, asset_line_number, asset_type, id_local){
        var self = this;
		this.oModel.read("/Incident_Involved_Property(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {	
                context: null,
                success: function(oResponseData, response) {
                  self.mPropertyDetails.setData(oResponseData);
                }
            });
    }, 

	loadEquipmentDamages: function(asset_id, asset_line_number, asset_type, id_local){
        var self = this;
		this.oModel.read("/Incident_Involved_Property(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')/ASSET_DAMAGE_PROP", {	
                context: null,
                success: function(oResponseData, response) {
				   self.mEquipmentDamages.setData(oResponseData);
                }
            });
    },
	//property lookup
	loadEquipmentList: function() {
		var self = this;
		$.ajax("/ws_restful_ehs_data_controller/PROPERTY_LIST").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mEquipmentList.setData(aResponseData);
		});	
	},	
    equipmentLookupPress: function(){
		var dialog = this.getEquipmentDialog();
		dialog.open();
	},
      
	getEquipmentDialog: function () {
		if (!this.equipmentDialog) {
			this.equipmentDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.equipment", this);
			this.equipmentDialog.setModel(this.mEquipmentList);
			this.getView().addDependent(this.equipmentDialog);
		}
		return this.equipmentDialog;
	},

	equipmentDialogCancel: function(){
		this.getEquipmentDialog().close();
	},

	onEquipmentSelect: function (oEvent){
		var assetIDValue= oEvent.getSource().getBindingContext().getObject().EQUIPMENT_ID;
		var equipmentDescValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_DESC;
		var equipmentTypeValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_TYPE
		this.mPropertyDetails.setProperty("/ASSET_ID", assetIDValue);
		this.mPropertyDetails.setProperty("/PROPERTY_DESC", equipmentDescValue);
		this.mPropertyDetails.setProperty("/PROPERTY_TYPE", equipmentTypeValue);
		this.equipmentDialogCancel();
		sap.ushell.Container.setDirtyFlag(true);
	},
	equipmentFilter: function (oEvent) {
		// add filter for search
		var aFilters = [];
		var sQuery = oEvent.getSource().getValue();
		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("EQUIPMENT_ID", sap.ui.model.FilterOperator.Contains, sQuery);
			aFilters.push(filter);
		}

		// update list binding
		//var binding = sap.ui.getCore().byId("equipmentTable").getBinding("items");
		var binding = this.equipmentDialog.getContent()[1].getBinding("items");
		binding.filter(aFilters, "Application");
	},
    onPropertyEdit: function(oEvent) {
		this.mState.setProperty("/editing", true);
    },

	onPropertyCancel: function(oEvent) {
		this.mState.setProperty("/editing", false);
		this.loadPropertyDetails(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);		
	},
	// property type lookup
	loadEquipmentTypeList: function() {
		var self = this;
		$.ajax("/ws_restful_ehs_data_controller/ASSET_TYPE").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mEquipmentTypeList.setData(aResponseData);
		});	
	},
	equipmentTypeLookupPress: function(){
		var dialog = this.getEquipmentTypeDialog();
		dialog.open();
	},
  
	getEquipmentTypeDialog: function () {
		if (!this.equipmentTypeDialog) {
			this.equipmentTypeDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.equipmentType", this);
			this.equipmentTypeDialog.setModel(this.mEquipmentTypeList);
			this.getView().addDependent(this.equipmentTypeDialog);
		}
		return this.equipmentTypeDialog;
	},

	equipmentTypeDialogCancel: function(){
		this.getEquipmentTypeDialog().close();
	},

	onEquipmentTypeSelect: function (oEvent){
		var propertyTypeDescValue = oEvent.getSource().getBindingContext().getObject().ASSET_TYPE;
		this.mPropertyDetails.setProperty("/PROP_TYPE", propertyTypeDescValue);
		this.equipmentTypeDialogCancel();
		sap.ushell.Container.setDirtyFlag(true);
	},

	equipmentTypeFilter: function (oEvent) {
		var aFilters = [];
		var sQuery = oEvent.getSource().getValue();
		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("ASSET_TYPE", sap.ui.model.FilterOperator.Contains, sQuery);
			aFilters.push(filter);
		}
		//var binding = sap.ui.getCore().byId("equipmentTypeTable").getBinding("items");
		var binding = this.equipmentTypeDialog.getContent()[1].getBinding("items");
		binding.filter(aFilters, "Application");
	},
		
	createEquipmentDamage: function() {
		var self = this;
		self.getRouter().navTo("createEquipmentDamage", { ID_LOCAL: self.id_local, ASSET_LINE_NO: self.asset_line_number, ASSET_ID: self.asset_id, ASSET_TYPE: self.asset_type});
    },
	navToAddEquipmentDamage: function(oControlEvent){
		var self = this;
		this.getRouter().navTo("equipmentDamageDetails", { ID_LOCAL: this.id_local, 
			ASSET_ID: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_ID,
			ASSET_LINE_NO: self.asset_line_number,
			ASSET_DAMAGE_LINE_NO: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_DAMAGE_LINE_NO,
			ASSET_TYPE: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_TYPE});
    },
	navToAssetList: function(){
		var self = this;
		var sHash = "#depIncident-list&/edit/" + self.id_local;
		Utilities.navToExternal(sHash);
	},
    onPropertySave: function(oEvent) {
            var assetIDValue = this.getView().byId("assetID").getValue();
			var assetTypeValue = this.getView().byId("assetType").getValue();
			var assetLineNumberValue = this.getView().byId("assetLineNumber").getValue();
			var propDescValue = this.getView().byId("propDesc").getValue();
			var propTypeValue = this.getView().byId("propType").getValue();
			var locDescValue = this.getView().byId("locDesc").getValue();
			var addDescValue = this.getView().byId("addDesc").getValue();
			
			var poFirstNameValue = this.getView().byId("pofirstName").getValue();
			var poLastNameValue = this.getView().byId("polastName").getValue();
			var poOrgUnitIDValue = this.getView().byId("poOrgUnitID").getValue();
			var pocompanyValue = this.getView().byId("pocompany").getValue();
			var poaddressValue = this.getView().byId("poaddress").getValue();
			var pophoneValue = this.getView().byId("pophone").getValue();
			var poemailValue = this.getView().byId("poemail").getValue();
			
			var ptFirstNameValue = this.getView().byId("ptfirstName").getValue();
			var ptLastNameValue = this.getView().byId("ptlastName").getValue();
			var ptOrgUnitIDValue = this.getView().byId("ptOrgUnitID").getValue();
			var ptcompanyValue = this.getView().byId("ptcompany").getValue();
			var ptaddressValue = this.getView().byId("ptaddress").getValue();
			var ptphoneValue = this.getView().byId("ptphone").getValue();
			var ptemailValue = this.getView().byId("ptemail").getValue();
 						  			
			var oRequestData = Object.assign({
				ASSET_ID: assetIDValue,
				ASSET_TYPE: assetTypeValue,
                ASSET_LINE_NO: assetLineNumberValue,				
				PROP_DESC: propDescValue,
				PROP_TYPE: propTypeValue,
				PROP_LOC_DESC: locDescValue,
				PROP_ADD_DESC: addDescValue,
				
				PROP_OWNER_FNAME: poFirstNameValue,
				PROP_OWNER_LNAME: poLastNameValue,
				PROP_OWNER_ADDRESS: poaddressValue,
				PROP_OWNER_COMPANY: pocompanyValue,
				PROP_OWNER_EMAIL: poemailValue,
				PROP_OWNER_ORG: poOrgUnitIDValue,
				PROP_OWNER_PHONE: pophoneValue,
				
				PROP_TENANT_FNAME: ptFirstNameValue,
				PROP_TENANT_LNAME: ptLastNameValue,
				PROP_TENANT_ADDRESS: ptaddressValue,
				PROP_TENANT_COMPANY: ptcompanyValue,
				PROP_TENANT_EMAIL: ptemailValue,
				PROP_TENANT_ORG: ptOrgUnitIDValue,
				PROP_TENANT_PHONE: ptphoneValue				
            }, this.mInvolvedProperty.getData());
			var self = this;
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: self.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "POST",
			   data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("Toast.otherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("Toast.updatePropertySuccess"), {
                        closeOnBrowserNavigation: false
                    });
					self.mState.setProperty("/editing", false);
					sap.ushell.Container.setDirtyFlag(false);
					self.loadPropertyDetails(self.asset_id, self.asset_line_number, self.asset_type, self.id_local);					 
					 
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("Toast.communicationError"));
            }));
        },
    removeEquipmentDamagePress: function(oEvent) {
		self = this;
		this.asset_id = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_ID;
		this.asset_type = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_TYPE;
		this.asset_damage_line_number = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ASSET_DAMAGE_LINE_NO;
		this.id_local = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT_DAMAGES").getObject().ID_LOCAL;
		this.mEquipmentDamages.setProperty("/ASSET_ID", this.asset_id );
		this.mEquipmentDamages.setProperty("/ASSET_TYPE", this.asset_type);
		this.mEquipmentDamages.setProperty("/ASSET_DAMAGE_LINE_NO", this.asset_damage_line_number);
		var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
		
		Utilities.showBusyIndicator($.ajax({
				headers: {IRID: this.id_local},
                url: "/ws_restful_ehs_data_controller/ASSET_DAMAGE",
                method: "DELETE",
                data: JSON.stringify([ this.mEquipmentDamages.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                }				
                else if (oResponseData.STATUS === "200") {
					sap.ushell.Container.setDirtyFlag(false);
					sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeEquipmentDamageSuccess", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                    self.mEquipmentDamages.refresh();
					self.loadEquipmentDamages(self.asset_id, self.asset_line_number, self.asset_type, self.id_local);
                    self.getView().setModel(self.mEquipmentDamages, "INVOLVED_EQUIPMENT_DAMAGES");							
                }					
				else if (oResponseData.STATUS === "409") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeEquipmentDamageFail", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                } else {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Error.generalError"), {
                        closeOnBrowserNavigation: false
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
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