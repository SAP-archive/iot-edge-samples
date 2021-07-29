jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");

(function(DetailControllerBase, Utilities, DataAccess) {
	DetailControllerBase.extend("dep.fiori.incident.app.create", {
//sap.ui.controller("dep.fiori.incident.app.create", {
    onInit: function() {
    	this.setKey("ID_LOCAL");
		DetailControllerBase.prototype.onInit.apply(this, arguments);

        // for error message window
        this.check = false;
        this.oMessageTemplate = new sap.m.MessagePopoverItem({
            title: {
                path: "TITLE"
            },
            subtitle: {
                path: "SUBTITLE"
            }
        });

        this.oMessagePopover = new sap.m.MessagePopover({
            items: {
                path: "/",
                template: this.oMessageTemplate
            },
            initiallyExpanded: true
        });
		
		this.mState = new sap.ui.model.json.JSONModel({ editing: true });
        this.getView().setModel(this.mState, "state");

        this.mErrors = new sap.ui.model.json.JSONModel();
        this.mErrors.setData([]);

        this.oMessagePopover.setModel(this.mErrors);
        this.oMessagesButton = this.getView().byId("messages-button");
        this.oMessagesButton.setModel(this.mErrors);

        var oComponentRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.setRouter(oComponentRouter);

        var view = this.getView();

        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");

        this.mIncident = new sap.ui.model.json.JSONModel();
        view.setModel(this.mIncident);

        this.mTimezoneList = new sap.ui.model.json.JSONModel();
		this.mTimezoneList.setSizeLimit(200);
        view.byId("incident-reporting-timezone").setModel(this.mTimezoneList);

		
        this.loadTimezoneList();

        this.mLocationList = new sap.ui.model.json.JSONModel();
        this.loadLocationList();

        this.mCreatedByImg = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mCreatedByImg, "createdByImg");
        var self = this;
        dep.fiori.lib.util.Utilities.getUserImage().done(function(oResponseData) {
            self.mCreatedByImg.setData(oResponseData);
        });
		
		this.mPlantId = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mPlantId, "plantIDModel");
		
		$.ajax("/ws_restful_ehs_data_controller/current_plant").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mPlantId.setProperty("/PLANT_ID", aResponseData[0].PLANT_ID);
		});
		
		this.orgUnitList = new sap.ui.model.json.JSONModel();		
        this.getView().setModel(this.orgUnitList, "orgUnitModel");
		
		$.ajax("/ws_restful_ehs_data_controller/ORGANIZATIONAL_UNIT").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.orgUnitList.setData(aResponseData);
		});
		
		this.mLocationClassificationList = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mLocationClassificationList, "locationClassificationModel");
		$.ajax("/ws_restful_ehs_data_controller/LOCATION_CLASS").done(function(aResponseData) {
			aResponseData = aResponseData || [];
			self.mLocationClassificationList.setData(aResponseData);
		});
		

        var oDate = new Date();
        //var timeZoneFullString = oDate.toString().match(/\(([A-Za-z\s].*)\)/)[1];
        //var timeZoneShortString = timeZoneFullString.match(/\b(\w)/g).join("");
        view.byId("datePicker").setDateValue(oDate);
        view.byId("timePicker").setDateValue(oDate);
        //view.byId("incident-reporting-timezone").setSelectedKey(timeZoneShortString);			
    },
	
    getRouter: function() {
        return this.oRouter;
    },

    setRouter: function(oRouter) {
        this.oRouter = oRouter;
    },

    loadLocationList: function() {
        var self = this;
        this.oModel.read("/Location", {
            context: null,
            success: function(oResponseData){
                self.mLocationList.setData(oResponseData.results);
            },
            error: function(oResponseData, response){

            }
        });
    },
	loadLocationClassificationList: function() {
		var self = this;
		jQuery.ajax({
            method: "GET",
            url: "/ws_restful_ehs_data_controller/LOCATION_CLASS"
        }
        ).done(function(oResponseData){
			//console.log(oResponseData); 
		    return self.mLocationClassificationList.setData(oResponseData)
		})

	},

 /*    loadTimezoneList: function() {
        var self = this;
        this.oModel.read("/Timezone", {
            context: null,
            success: function(oResponseData){
                self.mTimezoneList.setData(oResponseData.results);
				var oDateTimezone = new Date();
				var timeZoneFullString = oDateTimezone.toString().match(/\(([A-Za-z\s].*)\)/)[1];
				var timeZoneShortString = timeZoneFullString.match(/\b(\w)/g).join("");						
				var getTimezone = self.getView().byId("incident-reporting-timezone");
				getTimezone.insertItem(new sap.ui.core.ListItem({text: '', key: undefined}), 0);
				//check masterdata timezone and compare with browser timezone
				for (var x = 0; x <  self.mTimezoneList.getData().length; x ++) {
					if (self.mTimezoneList.getData()[x].START_TIME_ZONE = timeZoneShortString) {
						 self.getView().byId("incident-reporting-timezone").setSelectedKey(timeZoneShortString);	
					}
					else {
						var firstTimezoneItem =  self.getView().byId("incident-reporting-timezone").getFirstItem().getKey();
						 self.getView().byId("incident-reporting-timezone").setSelectedKey(firstTimezoneItem);	

					}
				}	
            },
            error: function(oResponseData, response){

            }
        });
    },
  */
  //change to rest timezone so it doesn't need pagination like Odata
    loadTimezoneList: function() {
		var self = this;
		jQuery.ajax({
            method: "GET",
            url: "/ws_restful_ehs_data_controller/Timezone",
			success: function(oResponseData) {
				return self.mTimezoneList.setData(oResponseData);
			},
			complete: function() {
				var oDateTimezone = new Date();
				var timeZoneFullString = oDateTimezone.toString().match(/\(([A-Za-z\s].*)\)/)[1];
				var timeZoneShortString = timeZoneFullString.match(/\b(\w)/g).join("");			
				var getTimezone = self.getView().byId("incident-reporting-timezone");
				getTimezone.insertItem(new sap.ui.core.ListItem({text: '', key: undefined}), 0);			
				//check masterdata timezone and compare with browser timezone
				for (var x = 0; x < self.mTimezoneList.getData().length; x ++) {
					if (self.mTimezoneList.getData()[x].START_TIME_ZONE = timeZoneShortString) {
						self.getView().byId("incident-reporting-timezone").setSelectedKey(timeZoneShortString);
						self.mTimezoneList.setSizeLimit(self.mTimezoneList.getData().length);							 
					}
					else {
						var firstTimezoneItem =  self.getView().byId("incident-reporting-timezone").getFirstItem().getKey();
						self.getView().byId("incident-reporting-timezone").setSelectedKey(firstTimezoneItem);	

					}
				}	
			}
        })
	}, 
    accidentLocationPress: function(){
        var dialog = this.getAccidentLocationDialog();
        dialog.open();
    },

    getAccidentLocationDialog: function () {
        if (!this.accidentLocationDialog) {
            this.accidentLocationDialog = new sap.ui.xmlfragment("dep.fiori.incident.app.accidentLocation", this);
            this.accidentLocationDialog.setModel(this.mLocationList);
            this.getView().addDependent(this.accidentLocationDialog);
        }
        return this.accidentLocationDialog;
    },

    accidentLocationDialogCancel: function(){
        this.getAccidentLocationDialog().close();
        // this.accidentLocationDialog = null;
    },

    onAccidentLocationSelect: function (oEvent){
        var locCodeValue = oEvent.getSource().getBindingContext().getObject().LOC_CODE;
		var locDescValue = oEvent.getSource().getBindingContext().getObject().DESCRIPTION;
        this.mIncident.setProperty("/PLANT_LOC_CODE", locCodeValue);
		this.mIncident.setProperty("/PLANT_LOC_DESCRIPTION", locDescValue);
        this.accidentLocationDialogCancel();
        sap.ushell.Container.setDirtyFlag(true);
        this.validate();
    },

    accidentLocationFilter: function (oEvent) {
        // add filter for search
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
            var filter = new sap.ui.model.Filter("LOC_CODE", sap.ui.model.FilterOperator.Contains, sQuery);
            aFilters.push(filter);
        }

        // update list binding
        var binding = sap.ui.getCore().byId("accidentLocationTable").getBinding("items");
        binding.filter(aFilters, "Application");
    },
	 orgUnitPress: function(){
        var dialog = this.getOrgUnitDialog();
        dialog.open();
    },

    getOrgUnitDialog: function () {
        if (!this.orgUnitDialog) {
            this.orgUnitDialog = new sap.ui.xmlfragment("dep.fiori.incident.app.orgUnit", this);
            this.orgUnitDialog.setModel(this.orgUnitList);
            this.getView().addDependent(this.orgUnitDialog);
        }
        return this.orgUnitDialog;
    },

    orgUnitDialogCancel: function(){
        this.getOrgUnitDialog().close();
    },

    onOrgUnitSelect: function (oEvent){
        var orgUnitValue = oEvent.getSource().getBindingContext().getObject().ORG_UNIT_ID;
        var orgUnitDesc = oEvent.getSource().getBindingContext().getObject().ORG_UNIT_DESCRIPTION;        
        this.mIncident.setProperty("/ORG_UNIT", orgUnitValue);
        this.mIncident.setProperty("/ORG_UNIT_DESCRIPTION", orgUnitDesc);
        this.orgUnitDialogCancel();
        sap.ushell.Container.setDirtyFlag(true);
        this.validate();
    },
    accidentLocationClassificationPress: function(){
        var dialog = this.getAccidentLocationClassificationDialog();
        dialog.open();
    },
	getAccidentLocationClassificationDialog: function () {
        if (!this.accidentLocationClassificationDialog) {
            this.accidentLocationClassificationDialog = new sap.ui.xmlfragment("dep.fiori.incident.app.accidentLocationClassification", this);			
            this.accidentLocationClassificationDialog.setModel(this.mLocationClassificationList);
            this.getView().addDependent(this.accidentLocationClassificationDialog);
        }
        return this.accidentLocationClassificationDialog;
    },
	accidentLocationClassificationDialogCancel: function(){
        this.getAccidentLocationClassificationDialog().close();
    },
	onAccidentLocationClassificationSelect: function (oEvent){
        var locClassificationValue = oEvent.getSource().getBindingContext().getObject().LOCATION_CLASS_ID;
		var locClassificationDesc = oEvent.getSource().getBindingContext().getObject().DESCRIPTION;
		this.mIncident.setProperty("/PLANT_LOC_CL_CODE", locClassificationValue);
        this.mLocationClassificationList.setProperty("/PLANT_LOC_CL_DESCRIPTION", locClassificationDesc);
		this.mIncident.setProperty("/PLANT_LOC_CL_DESCRIPTION", locClassificationDesc);
        this.accidentLocationClassificationDialogCancel();
        sap.ushell.Container.setDirtyFlag(true);
        this.validate();
    },
	accidentLocationClassificationFilter: function (oEvent) {
        // add filter for search
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
            var filter = new sap.ui.model.Filter("DESCRIPTION", sap.ui.model.FilterOperator.Contains, sQuery);
            aFilters.push(filter);
        }

        // update list binding
        var binding = sap.ui.getCore().byId("accidentLocationClassificationTable").getBinding("items");
        binding.filter(aFilters, "Application");
    },
	onUnknownTimeSelect: function(oEvent) {
		self = this;
		var sUnknownTime = oEvent.getParameter("selected") ? "X" : " ";
		this.mIncident.setProperty("/TIME_NOT_DET_IND", sUnknownTime);
		if (sUnknownTime = "X") {
			self.mState.setProperty("/editing", false);
             			
		}
		if (!oEvent.getParameter("selected")) {
			self.mState.setProperty("/editing", true);
		}
		 		
	},
    handleMessagePopoverPress: function(oEvent){
        this.oMessagePopover.toggle(oEvent.getSource());
    },

    validate: function(){
        var flag = true;
        if (this.check) {
            this.mErrors.setData([]);
            var sTime = this.mIncident.getProperty("/START_TIME");
            var timeZone = this.getView().byId("incident-reporting-timezone").getSelectedKey();
            var title = this.mIncident.getProperty("/TITLE");
            //var descOfEvent = this.mIncident.getProperty("/ELTXT");
			//var immActions = this.mIncident.getProperty("/ALTXT");
            //var accidentLoc = this.mIncident.getProperty("/PLANT_LOC_CODE");
            var sDate = this.mIncident.getProperty("/START_DATE");
            var aErrors = this.mErrors.getData();
            var now = new Date();
            var i18n = this.getView().getModel("i18n");
            var i18nGlobal = this.getView().getModel("i18nGlobal");
            if (sDate && sTime) {
                var newDate = dep.fiori.lib.util.Utilities.date.fromDateAndTime(sDate, sTime);
                if (newDate > now) {
                        // new reading time cannot be in the future
                        // i18nGlobal.getProperty("General.error")
                    aErrors.push({
                        TITLE: i18n.getProperty("Error.dateError"),
                        SUBTITLE: i18n.getProperty("Error.dateCannotBeInTheFuture")
                    });
                    this.getView().byId("datePicker").setValueState("Error");
                    this.getView().byId("timePicker").setValueState("Error");
                    flag = false;
                } else {
                    this.getView().byId("datePicker").setValueState("None");
                    this.getView().byId("timePicker").setValueState("None");
                }
            } else {
                flag = false;
                if (!sDate) {
                    this.getView().byId("datePicker").setValueState("Error");
                } else {
                    this.getView().byId("datePicker").setValueState("None");
                }
                if (!sTime) {
                    this.getView().byId("timePicker").setValueState("Error");
                } else {
                    this.getView().byId("timePicker").setValueState("None");
                }
            }

            if ( timeZone && title
                //&& descOfEvent && accidentLoc) {
				){	
                this.getView().byId("incidentTitle").setValueState("None");
                //this.getView().byId("descriptionOfEvents").setValueState("None");
                //this.getView().byId("incident-reporting-location").setValueState("None");
                this.getView().byId("incident-reporting-timezone").setValueState("None");
            } else {
                flag = false;
                aErrors.push({
                    TITLE: i18nGlobal.getProperty("General.error"),
                    SUBTITLE: i18n.getProperty("Error.missingRequiredFields")
                });
                if (!title) {
                    this.getView().byId("incidentTitle").setValueState("Error");
                } else {
                    this.getView().byId("incidentTitle").setValueState("None");
                }
                /*if (!descOfEvent) {
                    this.getView().byId("descriptionOfEvents").setValueState("Error");
                } else {
                    this.getView().byId("descriptionOfEvents").setValueState("None");
                }
                if (!accidentLoc) {
                    this.getView().byId("incident-reporting-location").setValueState("Error");
                } else {
                    this.getView().byId("incident-reporting-location").setValueState("None");
                }*/
                if (!timeZone) {
                    this.getView().byId("incident-reporting-timezone").setValueState("Error");
                } else {
                    this.getView().byId("incident-reporting-timezone").setValueState("None");
                }
            }
            this.mErrors.refresh();
            return flag;
        }
        return false;
    },

    onSubmitPress: function() {
        this.check = true;
        var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
        if (!this.validate()) {
            var aErrors = this.mErrors.getData();
            //display the first error message as a toast
            //will show a Date Error first, otherwise a Required Fields error
            sap.m.MessageToast.show(aErrors[0].SUBTITLE);
            return;
        }
        this.mIncident.setProperty("/START_TIME_ZONE", this.getView().byId("incident-reporting-timezone").getSelectedKey());
        this.mIncident.setProperty("/USER_ID_CR", sap.ushell.Container.getUser().getId());
        this.mIncident.setProperty("/REPORTED_DATE", "00000000");
		//this.mIncident.setProperty("/PLANT_LOC_CODE",this.mIncident.getData().PLANT_LOC_DESCRIPTION);
		//this.mIncident.setProperty("/PLANT_LOC_CL_CODE",this.mIncident.getData().PLANT_LOC_CL_DESCRIPTION);
		//this.mIncident.setProperty("/ORG_UNIT",this.orgUnitList.getData().ORG_UNIT_DESCRIPTION);
       // this.mIncident.setProperty("/PLANT_LOC_CL_CODE",this.mLocationClassificationList.getData().LOCATION_CLASS_ID);
        //this.mIncident.setProperty("/ORG_UNIT",this.orgUnitList.getData().ORG_UNIT_ID);
		var timeUnknown = this.mIncident.getData().TIME_NOT_DET_IND;
		if (timeUnknown == 'X') {
			this.mIncident.setProperty("/TIME_NOT_DET_IND", timeUnknown);
			this.mIncident.setProperty("/START_TIME_ZONE", "");
			this.mIncident.setProperty("/START_TIME", "");			
		}
        var self = this;
        jQuery.ajax({
            method: "POST",
            url: "/ws_restful_ehs_data_controller/INCIDENT",
            data: self.mIncident.getJSON()
        }).done(function(oResponseData, errorText, errorThrown ){
            if (oResponseData[0].ErrorID) {
                sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                    closeOnBrowserNavigation: false
                });
            } else {
                sap.ushell.Container.setDirtyFlag(false);
                
                var oData = new sap.ui.model.json.JSONModel();
                oData.setJSON(self.mIncident.getJSON());
                var sTime = oData.getProperty("/START_TIME");
                oData.setProperty("/START_TIME", dep.fiori.lib.util.Utilities.formatters.time(sTime));
                var sDate = oData.getProperty("/START_DATE");
                var parsedDate = dep.fiori.lib.util.Utilities.date.fromYYYYMMDD(sDate);
                oData.setProperty("/START_DATE", parsedDate.toDateString());
                oData.setProperty("/ID", oResponseData[0].OBJECT_KEY);
                
                self.getOwnerComponent().setSavedIncident(oData);
                
                if (oResponseData[0].STATUS == "200") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.success", [oResponseData[0].OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                    //self.getRouter().navTo("saved");
					var sHash = "#depIncident-list&/edit/" + oResponseData[0].OBJECT_KEY;
					Utilities.navToExternal(sHash);
                } else if (oResponseData[0].STATUS == "409") {
                    self.getDuplicateIncDialog().open();
                } else {
                    sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                        closeOnBrowserNavigation: false
                    });
                }
            }
        });
    },
    onCancel: function() {
		window.history.go(-1);
	},
    getDuplicateIncDialog: function () {
        if (!this.duplicateIncDialog) {
            this.duplicateIncDialog = sap.ui.xmlfragment("dep.fiori.incident.app.duplicateincident", this);
            this.getView().addDependent(this.duplicateIncDialog);
        }
        return this.duplicateIncDialog;
    },
    
    duplicateIncDialogOk: function(){
        this.getDuplicateIncDialog().destroy();
        this.duplicateIncDialog = null;
    },

    duplicateIncDialogView: function(){
        this.getDuplicateIncDialog().destroy();
        this.duplicateIncDialog = null;
        this.getRouter().navTo("saved");
    },
});
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));