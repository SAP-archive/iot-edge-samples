jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");


(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.createProperty", {
        onInit: function() {
	        var incidentID = {};
	       //this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
	       //this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("createProperty").attachMatched(this._onRouteMatched);  		   
	        CreateControllerBase.prototype.onInit.apply(this, arguments);
			this.mInvolvedProperty = this.getObjectModel();
			this.mPropertyList = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.mPropertyList, "INVOLVED_PROPERTY");
			this.loadPropertyList();
			this.mEquipmentTypeList = new sap.ui.model.json.JSONModel();
			this.loadEquipmentTypeList();
        },
        
		_onRouteMatched : function(oEvent) {
			oArgs = oEvent.getParameter("arguments");
			incidentID = oArgs.ID_LOCAL;
		},
		//property lookup
		loadPropertyList: function() {
			var self = this;
			$.ajax("/ws_restful_ehs_data_controller/PROPERTY_LIST").done(function(aResponseData) {
				aResponseData = aResponseData || [];
				self.mPropertyList.setData(aResponseData);
			});	
		},
		propertyLookupPress: function(){
			var dialog = this.getPropertyDialog();
			dialog.open();
		},
      
		getPropertyDialog: function () {
			if (!this.propertyDialog) {
				this.propertyDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.property", this);
				this.propertyDialog.setModel(this.mPropertyList);
				this.getView().addDependent(this.propertyDialog);
			}
			return this.propertyDialog;
		},

		propertyDialogCancel: function(){
			this.getPropertyDialog().close();
		},

		onPropertySelect: function (oEvent){
			var propertyIDValue= oEvent.getSource().getBindingContext().getObject().PROPERTY_ID;
			var propertyDescValue = oEvent.getSource().getBindingContext().getObject().PROPERTY_DESC;
			var propertyTypeValue = oEvent.getSource().getBindingContext().getObject().PROPERTY_TYPE;
			this.mPropertyList.setProperty("/PROP_ID", propertyIDValue);
			this.mPropertyList.setProperty("/PROP_DESC", propertyDescValue);
			this.mPropertyList.setProperty("/PROP_TYPE", propertyTypeValue);
			this.propertyDialogCancel();
			sap.ushell.Container.setDirtyFlag(true);
		},

		propertyFilter: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("PROPERTY_ID", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			//var binding = sap.ui.getCore().byId("propertyTable").getBinding("items");
			var binding = this.propertyDialog.getContent()[1].getBinding("items");
			binding.filter(aFilters, "Application");
		},
		
		//property type lookup
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
			this.mPropertyList.setProperty("/PROP_TYPE", equipmentTypeDescValue);
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
		loadProperty: function(id, assetID){
				this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        		var self = this;
        		this.oModel.read("/Incident_Involved_Property("+"ASSET_ID='" + assetID + "'," + "ASSET_TYPE='" + '003' + "'," + "ID_LOCAL='" + id + "')", {	
                context: null,
                success: function(oResponseData, response) {
                    self.mInvolvedProperty.setData(oResponseData);
                },
            	error: function(oResponseData, response){
            	}	
            });
    	},
    	*/
    
        propertySave: function(oEvent) {
			var i18n = this.getView().getModel("i18n");
        	var self=this;

            var propIDValue = this.getView().byId("propertyID").getValue();
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
			
			this.mInvolvedProperty.setProperty("/ASSET_ID", propIDValue);
			this.mInvolvedProperty.setProperty("/ASSET_TYPE", "003");
			this.mInvolvedProperty.setProperty("/PROP_DESC", propDescValue);
			this.mInvolvedProperty.setProperty("/PROP_TYPE", propTypeValue);
			this.mInvolvedProperty.setProperty("/PROP_LOC_DESC", locDescValue);
			this.mInvolvedProperty.setProperty("/PROP_ADD_DESC", addDescValue);
			
			this.mInvolvedProperty.setProperty("/PROP_OWNER_FNAME", poFirstNameValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_LNAME", poLastNameValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_ADDRESS", poaddressValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_COMPANY", pocompanyValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_EMAIL", poemailValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_ORG", poOrgUnitIDValue);
			this.mInvolvedProperty.setProperty("/PROP_OWNER_PHONE", pophoneValue);
			
			this.mInvolvedProperty.setProperty("/PROP_TENANT_FNAME", ptFirstNameValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_LNAME", ptLastNameValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_ADDRESS", ptaddressValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_COMPANY", ptcompanyValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_EMAIL", ptemailValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_ORG", ptOrgUnitIDValue);
			this.mInvolvedProperty.setProperty("/PROP_TENANT_PHONE", ptphoneValue);
	
			
			var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR2"));
                return;
            }			
			var localID = incidentID;
			
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: localID },
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "POST",
                data: JSON.stringify([ this.mInvolvedProperty.getData() ])
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
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.createPropertySuccess"), {
                        closeOnBrowserNavigation: true
                    });
					self.getView().byId("propertyID").setValue("");
					self.getView().byId("propDesc").setValue("");
					self.getView().byId("propType").setValue("");
					self.getView().byId("locDesc").setValue("");
					self.getView().byId("addDesc").setValue("");
					self.getView().byId("pofirstName").setValue("");
					self.getView().byId("polastName").setValue("");
					self.getView().byId("poOrgUnitID").setValue("");
					self.getView().byId("pocompany").setValue("");
					self.getView().byId("poaddress").setValue("");
					self.getView().byId("pophone").setValue("");
					self.getView().byId("poemail").setValue("");
					self.getView().byId("ptfirstName").setValue("");
					self.getView().byId("ptlastName").setValue("");
					self.getView().byId("ptOrgUnitID").setValue("");
					self.getView().byId("ptcompany").setValue("");
					self.getView().byId("ptaddress").setValue("");
					self.getView().byId("ptphone").setValue("");
					self.getView().byId("ptemail").setValue("");
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