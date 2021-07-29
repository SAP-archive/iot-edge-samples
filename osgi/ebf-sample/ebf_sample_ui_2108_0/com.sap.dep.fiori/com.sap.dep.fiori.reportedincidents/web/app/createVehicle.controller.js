jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");


(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.createVehicle", {
        onInit: function() {
	        var incidentID = {};
	       	/* 
			this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
	        this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
	        CreateControllerBase.prototype.onInit.apply(this, arguments);  
		    this.mPlantId = new sap.ui.model.json.JSONModel();
	        var self = this;
	        $.ajax("/ws_restful_ehs_data_controller/current_plant").done(function(aResponseData) {
				aResponseData = aResponseData || [];
				self.mPlantId.setProperty("/PLANT_ID", aResponseData[0].PLANT_ID);
			});	
            */
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("createVehicle").attachMatched(this._onRouteMatched);
			CreateControllerBase.prototype.onInit.apply(this, arguments);  
            this.mInvolvedVehicle = this.getObjectModel(); 			
			//this.getView().setModel(this.mPlantId, "plantIDModel");
			this.mVehicle = this.getObjectModel();
			this.mEquipmentList = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.mEquipmentList, "INVOLVED_VEHICLE");
			this.mEquipmentTypeList = new sap.ui.model.json.JSONModel();
			this.loadEquipmentList();
			this.loadEquipmentTypeList();
        },
        /*
	    getRouter: function() {
	        return this.oRouter;
	    },

	    setRouter: function(oRouter) {
	        this.oRouter = oRouter;
	    },
	    
        _onRouteMatched : function(oEvent) {
            this.mInvolvedVehicle = new sap.ui.model.json.JSONModel();
			oArgs = oEvent.getParameter("arguments");
			id=oArgs.ID_LOCAL;
			this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
			if (oEvent.getParameter("name") === "vehicleDetails") {
            assetID = oEvent.getParameters().arguments.ASSET_ID;
            if (id) {
                this.loadVehicle(id, assetID);
                this.getView().setModel(this.mInvolvedVehicle, "INVOLVED_VEHICLE");
               }
        	}		
		},
		*/
		_onRouteMatched : function(oEvent) {
			oArgs = oEvent.getParameter("arguments");
			incidentID = oArgs.ID_LOCAL;
		},
		//vehicle and equipment lookup
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
			var vehicleIDValue= oEvent.getSource().getBindingContext().getObject().EQUIPMENT_ID;
			var vehicleDescValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_DESC;
			var vehicleTypeValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_TYPE;
			this.mEquipmentList.setProperty("/VEHICLE_ID", vehicleIDValue);
			this.mEquipmentList.setProperty("/VEHICLE_DESC", vehicleDescValue);
			this.mEquipmentList.setProperty("/VEHICLE_TYPE", vehicleTypeValue);
			this.equipmentDialogCancel();
			sap.ushell.Container.setDirtyFlag(true);
		},

		equipmentFilter: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("EQUIPMENT_ID", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			//var binding = sap.ui.getCore().byId("equipmentTable").getBinding("items");
			var binding = this.equipmentDialog.getContent()[1].getBinding("items");
			binding.filter(aFilters, "Application");
		},
		
		//vehicle and equipment type lookup
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
			this.mEquipmentList.setProperty("/VEHICLE_TYPE", equipmentTypeDescValue);
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
		/*
		loadVehicle: function(id, assetID){
				this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        		var self = this;
        		this.oModel.read("/Incident_Involved_Vehicle("+"ASSET_ID='" + assetID + "'," + "ASSET_TYPE='" + '002' + "'," + "ID_LOCAL='" + id + "')", {	
                context: null,
                success: function(oResponseData, response) {
                    self.mInvolvedVehicle.setData(oResponseData);
                },
            	error: function(oResponseData, response){
            	}	
            });
    	},
		*/
    	
    
        vehicleSave: function(oEvent) {
			var i18n = this.getView().getModel("i18n");
        	var self=this;

            var vehicleIDValue = this.getView().byId("vehicleID").getValue();
			var vehicleDescValue = this.getView().byId("vehicleDesc").getValue();
			var vehicleTypeValue = this.getView().byId("vehicleType").getValue();
			var assetTypeValue = "002";
			var vehicleManuValue = this.getView().byId("vehicleManu").getValue();
			var vehicleModelValue = this.getView().byId("vehicleModel").getValue();
			var vehicleLicValue = this.getView().byId("vehicleLic").getValue();
			var addDescriptionValue = this.getView().byId("addDescription").getValue();
			
			var voFirstNameValue = this.getView().byId("vofirstName").getValue();
			var voLastNameValue = this.getView().byId("volastName").getValue();
			var voOrgUnitIDValue = this.getView().byId("voOrgUnitID").getValue();
			var vocompanyValue = this.getView().byId("vocompany").getValue();
			var voaddressValue = this.getView().byId("voaddress").getValue();
			var vophoneValue = this.getView().byId("vophone").getValue();
			var voemailValue = this.getView().byId("voemail").getValue();
			
			var vdFirstNameValue = this.getView().byId("vdfirstName").getValue();
			var vdLastNameValue = this.getView().byId("vdlastName").getValue();
			var vdOrgUnitIDValue = this.getView().byId("vdOrgUnitID").getValue();
			var vdcompanyValue = this.getView().byId("vdcompany").getValue();
			var vdaddressValue = this.getView().byId("vdaddress").getValue();
			var vdphoneValue = this.getView().byId("vdphone").getValue();
			var vdemailValue = this.getView().byId("vdemail").getValue();
			
			this.mInvolvedVehicle.setProperty("/ASSET_ID", vehicleIDValue);
			//this.mInvolvedVehicle.setProperty("/ASSET_TYPE", "002");
			this.mInvolvedVehicle.setProperty("/ASSET_TYPE", assetTypeValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DESC", vehicleDescValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_TYPE", vehicleTypeValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_MANUFACTURER", vehicleManuValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_MODEL", vehicleModelValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_LIC_PLATE_ID", vehicleLicValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_ADD_DESC", addDescriptionValue);
			
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_FNAME", voFirstNameValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_LNAME", voLastNameValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_ADDRESS", voaddressValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_COMPANY", vocompanyValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_EMAIL", voemailValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_ORG", voOrgUnitIDValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_OWNER_PHONE", vophoneValue);
			
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_FNAME", vdFirstNameValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_LNAME", vdLastNameValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_ADDRESS", vdaddressValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_COMPANY", vdcompanyValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_EMAIL", vdemailValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_ORG", vdOrgUnitIDValue);
			this.mInvolvedVehicle.setProperty("/VEHICLE_DRIVER_PHONE", vdphoneValue);
	
			
			var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR2"));
                return;
            }			
			//var idlocal =id;
			var localID = incidentID;
			
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: localID },
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "POST",
                data: JSON.stringify([ this.mInvolvedVehicle.getData() ])
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
                                self.getOwnerComponent().getRouter().navTo("edit", {
                        		ID_LOCAL: localID
                   				 });
                            }
                        }
                    });
                } else {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.createVehicleSuccess"), {
                        closeOnBrowserNavigation: true
                    });
					self.getView().byId("vehicleID").setValue("");
					self.getView().byId("vehicleDesc").setValue("");
					self.getView().byId("vehicleType").setValue("");
					self.getView().byId("vehicleManu").setValue("");
					self.getView().byId("vehicleModel").setValue("");
					self.getView().byId("vehicleLic").setValue("");
					self.getView().byId("addDescription").setValue("");
					self.getView().byId("vofirstName").setValue("");
					self.getView().byId("volastName").setValue("");
					self.getView().byId("voOrgUnitID").setValue("");
					self.getView().byId("vocompany").setValue("");
					self.getView().byId("voaddress").setValue("");
					self.getView().byId("vophone").setValue("");
					self.getView().byId("voemail").setValue("");
					self.getView().byId("vdfirstName").setValue("");
					self.getView().byId("vdlastName").setValue("");
					self.getView().byId("vdOrgUnitID").setValue("");
					self.getView().byId("vdcompany").setValue("");
					self.getView().byId("vdaddress").setValue("");
					self.getView().byId("vdphone").setValue("");
					self.getView().byId("vdemail").setValue("");
					sap.ushell.Container.setDirtyFlag(false);
                    self.getOwnerComponent().getRouter().navTo("edit", {
                        ID_LOCAL: localID
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities));