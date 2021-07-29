jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.createPeople", {
        onInit: function() {
        var id = {};
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("createPeople").attachMatched(this._onRouteMatched);
        CreateControllerBase.prototype.onInit.apply(this, arguments);
        this.mInvolvedPerson = this.getObjectModel();			
        },
        
        _onRouteMatched : function(oEvent) {
			oArgs = oEvent.getParameter("arguments");
			id=oArgs.ID_LOCAL;
		},
		
		onRadioSelect: function(oEvent){
			var oRadioGroup = sap.ui.getCore().byId("dep-fiori-reportedincidents-createPeople--involvedPersonType");     
			var selectedPersonType = oRadioGroup.getSelectedIndex();      
			if(selectedPersonType == 1) {
				this.getView().byId("injuredDescription").setVisible(false);
				this.getView().byId("descLabel").setVisible(false);
				}
			else if(selectedPersonType == 0) {
				this.getView().byId("injuredDescription").setVisible(true);
				this.getView().byId("descLabel").setVisible(true);
			}
		},
		
        personSave: function(oEvent) {
			var i18n = this.getView().getModel("i18n");
        	var self=this;
			var oRadioGroup = self.getView().byId("dep-fiori-reportedincidents-createPeople--involvedPersonType");     			
			var selectedPersonType = oRadioGroup.getSelectedIndex();
			var bSelectedType;
			if (selectedPersonType == 0) {
				bSelectedType = "EHHSS_PR_INJURED_PER"				
			}
			else if(selectedPersonType == 1) {
				bSelectedType =  "EHHSS_PR_WITNESS";
			}	
            var firstNameValue = this.getView().byId("firstName").getValue();
			var lastNameValue = this.getView().byId("lastName").getValue();
			var orgUnitValue = this.getView().byId("personOrgUnitID").getValue();
			var companyValue = this.getView().byId("company").getValue();
			var addressValue = this.getView().byId("address").getValue();
			var phoneValue = this.getView().byId("phone").getValue();
			var emailValue = this.getView().byId("email").getValue();
			var descValue = this.getView().byId("injuredDescription").getValue();
			
			this.mInvolvedPerson.setProperty("/FIRST_NAME", firstNameValue);
			this.mInvolvedPerson.setProperty("/LAST_NAME", lastNameValue);
			this.mInvolvedPerson.setProperty("/ADDRESS", addressValue);
			this.mInvolvedPerson.setProperty("/EMAIL", emailValue);
			this.mInvolvedPerson.setProperty("/PHONE", phoneValue);
			this.mInvolvedPerson.setProperty("/COMPANY", companyValue);
			this.mInvolvedPerson.setProperty("/ORG", orgUnitValue);
            this.mInvolvedPerson.setProperty("/IS_EXTERNAL", "X");
			this.mInvolvedPerson.setProperty("/INVOLVE_TYPE_ID", bSelectedType);
		    this.mInvolvedPerson.setProperty("/INJURY_DESCRIPTION", descValue);
			
			var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR2"));
                return;
            }			
			var idlocal =id;
			
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: idlocal },
                url: "/ws_restful_ehs_data_controller/INVOLVED_PARTY",
                method: "POST",
                data: JSON.stringify([ this.mInvolvedPerson.getData() ])
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
                        		ID_LOCAL: idlocal
                   				 });
                            }
                        }
                    });
                } else {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.createSuccess"), {
                        closeOnBrowserNavigation: true
                    });
					self.getView().byId("dep-fiori-reportedincidents-createPeople--involvedPersonType").setSelectedIndex(0);
					self.getView().byId("firstName").setValue("");
					self.getView().byId("lastName").setValue("");
					self.getView().byId("personOrgUnitID").setValue("");
					self.getView().byId("company").setValue("");
					self.getView().byId("address").setValue("");
					self.getView().byId("phone").setValue("");
					self.getView().byId("email").setValue("");
					self.getView().byId("injuredDescription").setValue("");
                    self.getOwnerComponent().getRouter().navTo("edit", {
                        ID_LOCAL: idlocal
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities));