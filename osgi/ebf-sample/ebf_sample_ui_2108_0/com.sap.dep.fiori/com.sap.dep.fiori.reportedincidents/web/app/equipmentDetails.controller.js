jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("sap.m.MessageBox");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.equipmentDetails", {	

    onInit: function () {
    	this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		CreateControllerBase.prototype.onInit.apply(this, arguments);	
		this.mInvolvedEquipment = this.getObjectModel();
		this.mEquipmentList = new sap.ui.model.json.JSONModel();
		this.loadEquipmentList();		
		this.mEquipmentTypeList = new sap.ui.model.json.JSONModel();
		this.loadEquipmentTypeList();		
		this.mEquipmentFLocationList = new sap.ui.model.json.JSONModel();	
		this.loadEquipmentFLocationList();					
	},    
    onRouteMatched: function (oEvent) {
        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        if (oEvent.getParameter("name") === "equipmentDetails") {
            this.asset_id = oEvent.getParameters().arguments.ASSET_ID;
			this.asset_line_number = oEvent.getParameters().arguments.ASSET_LINE_NO;
			this.asset_type = oEvent.getParameters().arguments.ASSET_TYPE;
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;			
            if (this.id_local) {
                this.loadEquipmentDetails(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);
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
        this.mEquipmentDetails = new sap.ui.model.json.JSONModel();		
		this.getView().setModel(this.mEquipmentDetails, "INVOLVED_EQUIPMENT_DETAILS");
		this.mEquipmentDamages = new sap.ui.model.json.JSONModel();		
		this.getView().setModel(this.mEquipmentDamages, "INVOLVED_EQUIPMENT_DAMAGES");			
    },

    loadEquipmentDetails: function(asset_id, asset_line_number, asset_type, id_local){
        var self = this;
		this.oModel.read("/Incident_Involved_Equipment(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')", {	
               // urlParameters: {$expand : "ASSET_DAMAGE_EQUI"},
                context: null,
                success: function(oResponseData, response) {
                  self.mEquipmentDetails.setData(oResponseData);
				  //self.mEquipmentDetails.setData(oResponseData.ASSET_DAMAGE_EQUI.results[0]);
                }
            });
    }, 

	loadEquipmentDamages: function(asset_id, asset_line_number, asset_type, id_local){
        var self = this;
		this.oModel.read("/Incident_Involved_Equipment(" + "ASSET_ID='" + asset_id + "',ASSET_LINE_NO='" + asset_line_number + "',ASSET_TYPE='" + asset_type + "',ID_LOCAL='" + id_local + "')/ASSET_DAMAGE_EQUI", {	
                context: null,
                success: function(oResponseData, response) {
				   self.mEquipmentDamages.setData(oResponseData);
                }
            });
    },
	//equiment lookup
	loadEquipmentList: function() {
		var self = this;
		$.ajax("/ws_restful_ehs_data_controller/EQUIPMENT_LIST").done(function(aResponseData) {
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
		var equipmentFLocValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_FLOC;
		this.mEquipmentDetails.setProperty("/ASSET_ID", assetIDValue);
		this.mEquipmentDetails.setProperty("/EQUIPMENT_DESC", equipmentDescValue);
		this.mEquipmentDetails.setProperty("/EQUIPMENT_TYPE", equipmentTypeValue);
		this.mEquipmentDetails.setProperty("/EQUIPMENT_FLOC", equipmentFLocValue);
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
    onEquipmentEdit: function(oEvent) {
		this.mState.setProperty("/editing", true);
    },

	onEquipmentCancel: function(oEvent) {
		this.mState.setProperty("/editing", false);
		this.loadEquipmentDetails(this.asset_id, this.asset_line_number, this.asset_type, this.id_local);		
	},
	//equipment type lookup
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
		var equipmentTypeDescValue = oEvent.getSource().getBindingContext().getObject().ASSET_TYPE;
		this.mEquipmentDetails.setProperty("/EQUIPMENT_TYPE", equipmentTypeDescValue);
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
	//equipment functinonal location lookup
	loadEquipmentFLocationList: function() {
		var self = this;
		$.ajax("/ws_restful_ehs_data_controller/location").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mEquipmentFLocationList.setData(aResponseData);
		});	
	},
	equipmentFLocationLookupPress: function(){
		var dialog = this.getEquipmentFLocationDialog();
		dialog.open();
	},
  
	getEquipmentFLocationDialog: function () {
		if (!this.equipmentFLocationDialog) {
			this.equipmentFLocationDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.equipmentFLocation", this);
			this.equipmentFLocationDialog.setModel(this.mEquipmentFLocationList);
			this.getView().addDependent(this.equipmentFLocationDialog);
		}
		return this.equipmentFLocationDialog;
	},

	equipmentFLocationDialogCancel: function(){
		this.getEquipmentFLocationDialog().close();
	},

	onEquipmentFLocationSelect: function (oEvent){
		var equipmentFLocationCodeValue = oEvent.getSource().getBindingContext().getObject().LOC_CODE;
		this.mEquipmentDetails.setProperty("/EQUIPMENT_FLOC", equipmentFLocationCodeValue);
		this.equipmentFLocationDialogCancel();
		sap.ushell.Container.setDirtyFlag(true);
	},

	equipmentFLocationFilter: function (oEvent) {
		var aFilters = [];
		var sQuery = oEvent.getSource().getValue();
		if (sQuery && sQuery.length > 0) {
			var filter = new sap.ui.model.Filter("LOC_CODE", sap.ui.model.FilterOperator.Contains, sQuery);
			aFilters.push(filter);
		}
		//var binding = sap.ui.getCore().byId("equipmentFlocationTable").getBinding("items");
		var binding = this.equipmentFLocationDialog.getContent()[1].getBinding("items");
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
    onEquipmentSave: function(oEvent) {
            var assetIDValue = this.getView().byId("assetID").getValue();
			var assetTypeValue = this.getView().byId("assetType").getValue();
			var assetLineNumberValue = this.getView().byId("assetLineNumber").getValue();
			var equipmentDescValue = this.getView().byId("equipmentDesc").getValue();			
			var equipmentTypeValue = this.getView().byId("equipmentType").getValue();
			//var equipmentPlantIDValue = this.getView().byId("equipmentPlantID").getValue();
			var equipmentFLocationValue = this.getView().byId("equipmentFLocation").getValue();
			var equipmentLocationDescValue = this.getView().byId("equipmentLocationDesc").getValue();
			var equipmentAdditionalDescValue = this.getView().byId("equipmentAdditionalDesc").getValue();
 						  			
			var oRequestData = Object.assign({
				ASSET_ID: assetIDValue,
				ASSET_TYPE: assetTypeValue,
                ASSET_LINE_NO: assetLineNumberValue,
                EQUIPMENT_DESC: equipmentDescValue,
                EQUIPMENT_TYPE:  equipmentTypeValue,
                EQUIPMENT_FLOC: equipmentFLocationValue,
                EQUIPMENT_LOC_DESC: equipmentLocationDescValue,
                EQUIPMENT_ADD_DESC: equipmentAdditionalDescValue
            }, this.mInvolvedEquipment.getData());
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
                    sap.m.MessageToast.show(self.getText("Toast.updateEquipmentSuccess"), {
                        closeOnBrowserNavigation: false
                    });
					self.mState.setProperty("/editing", false);
					sap.ushell.Container.setDirtyFlag(false);
					self.loadEquipmentDetails(self.asset_id, self.asset_line_number, self.asset_type, self.id_local);					 
					 
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