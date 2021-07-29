jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.createEquipment", {
        onInit: function() {
        var incidentID = {};
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("createEquipment").attachMatched(this._onRouteMatched);
        CreateControllerBase.prototype.onInit.apply(this, arguments);
        this.mEquipment = this.getObjectModel();
		this.mEquipmentList = new sap.ui.model.json.JSONModel();
		this.getView().setModel(this.mEquipmentList, "EQUIPMENT_DETAILS");
		this.mEquipmentTypeList = new sap.ui.model.json.JSONModel();
		this.mEquipmentFLocationList = new sap.ui.model.json.JSONModel();
		this.loadEquipmentList();
		this.loadEquipmentTypeList();
		this.loadEquipmentFLocationList();
		
        },
        
        _onRouteMatched : function(oEvent) {
			oArgs = oEvent.getParameter("arguments");
			incidentID = oArgs.ID_LOCAL;
		},
		
		//equipment lookup
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
			var equipmentIDValue= oEvent.getSource().getBindingContext().getObject().EQUIPMENT_ID;
			var equipmentDescValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_DESC;
			var equipmentTypeValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_TYPE
			var equipmentFLocValue = oEvent.getSource().getBindingContext().getObject().EQUIPMENT_FLOC;
			this.mEquipmentList.setProperty("/EQUIPMENT_ID", equipmentIDValue);
			this.mEquipmentList.setProperty("/EQUIPMENT_DESC", equipmentDescValue);
			this.mEquipmentList.setProperty("/EQUIPMENT_TYPE", equipmentTypeValue);
			this.mEquipmentList.setProperty("/EQUIPMENT_FLOC", equipmentFLocValue);
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
			//var equipmentTypeValue= oEvent.getSource().getBindingContext().getObject().ASSET_TYPE;
			var equipmentTypeDescValue = oEvent.getSource().getBindingContext().getObject().ASSET_TYPE;
			this.mEquipmentList.setProperty("/EQUIPMENT_TYPE", equipmentTypeDescValue);
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
			this.mEquipmentList.setProperty("/EQUIPMENT_FLOC", equipmentFLocationCodeValue);
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
				
        equipmentSave: function(oEvent) {
			var i18n = this.getView().getModel("i18n");
        	var self=this;
			
            var equipmentIDValue = this.getView().byId("equipmentID").getValue();
			var equipmentDescValue = this.getView().byId("equipmentDesc").getValue();
			var equipmentTypeValue = this.getView().byId("equipmentType").getValue();
			var assetTypeValue = "001";
			//var equipmentPlantIDValue = this.getView().byId("equipmentPlantID").getValue();
			var equipmentFLocationValue = this.getView().byId("equipmentFLocation").getValue();
			var equipmentLocationDescValue = this.getView().byId("equipmentLocationDesc").getValue();
			var equipmentAdditionalDescValue = this.getView().byId("equipmentAdditionalDesc").getValue();

			
			this.mEquipment.setProperty("/ASSET_ID", equipmentIDValue);
			this.mEquipment.setProperty("/ASSET_TYPE", assetTypeValue);
			this.mEquipment.setProperty("/EQUIPMENT_DESC", equipmentDescValue);
			this.mEquipment.setProperty("/EQUIPMENT_TYPE", equipmentTypeValue);
			//this.mEquipment.setProperty("/EQU_PLANT_ID", equipmentPlantIDValue);
			this.mEquipment.setProperty("/EQUIPMENT_FLOC", equipmentFLocationValue);
			this.mEquipment.setProperty("/EQUIPMENT_LOC_DESC", equipmentLocationDescValue);
			this.mEquipment.setProperty("/EQUIPMENT_ADD_DESC", equipmentAdditionalDescValue);
			
			var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR2"));
                return;
            }			
			var localID = incidentID;
			
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: localID},
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "POST",
                data: JSON.stringify([ this.mEquipment.getData() ])
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
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.createEquipmentSuccess"), {
                        closeOnBrowserNavigation: true
                    });
					self.getView().byId("equipmentID").setValue("");
					self.getView().byId("equipmentDesc").setValue("");
					self.getView().byId("equipmentType").setValue("");
					self.getView().byId("equipmentFLocation").setValue("");
					self.getView().byId("equipmentLocationDesc").setValue("");
					self.getView().byId("equipmentAdditionalDesc").setValue("");
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