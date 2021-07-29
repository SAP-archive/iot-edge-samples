jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("sap.m.MessageBox");


(function(DetailControllerBase, Utilities, CreateControllerBase) {
    DetailControllerBase.extend("dep.fiori.reportedincidents.app.edit", {
		
    onInit: function () {
        this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		
	
		this.mState = new sap.ui.model.json.JSONModel({ editing: false });
        this.getView().setModel(this.mState, "state");

		this.orgUnitList = new sap.ui.model.json.JSONModel();		
        this.getView().setModel(this.orgUnitList, "orgUnitModel");
		var self = this;
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

    },

    onRouteMatched: function (oEvent) {
         if (oEvent.getParameter("name") === "edit") {
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;
            if (this.id_local) {

                this.onInitAfterRoute();
            }
        } else {

        }
    },

    navToAddInjuredPerson: function(oControlEvent){
        this.getRouter().navTo("create", { ID_LOCAL: this.id_local, 
            LOCAL_PERSN_ID : oControlEvent.getSource().getBindingContext("INJURED_PEOPLE").getObject().LOCAL_PERSN_ID});
    },
	navToAddEquipment: function(oControlEvent){
        this.getRouter().navTo("equipmentDetails", {
            ASSET_ID: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_ID,
			ASSET_LINE_NO: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_LINE_NO,
			ASSET_TYPE: oControlEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_TYPE,
		    ID_LOCAL: this.id_local});
    },
	navToAddInvolvedVehicle: function(oControlEvent){
        this.getRouter().navTo("vehicleDetails", { ID_LOCAL: this.id_local, 
        ASSET_ID : oControlEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_ID,
		ASSET_LINE_NO: oControlEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_LINE_NO,			
        ASSET_TYPE : oControlEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_TYPE
        });
    },
    
    navToAddInvolvedProperty: function(oControlEvent){
        this.getRouter().navTo("propertyDetails", { ID_LOCAL: this.id_local, 
        ASSET_ID : oControlEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ASSET_ID,
		ASSET_LINE_NO: oControlEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ASSET_LINE_NO,			
        ASSET_TYPE : oControlEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ASSET_TYPE
        });
    },
    onInitAfterRoute: function() {


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

        this.mErrors = new sap.ui.model.json.JSONModel();
        this.mErrors.setData([]);

        this.oMessagePopover.setModel(this.mErrors);
        this.oMessagesButton = this.getView().byId("messages-button");
        this.oMessagesButton.setModel(this.mErrors);

        var oComponentRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.setRouter(oComponentRouter);

        var view = this.getView();

        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
		//this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata/Incident_Involved_People");
		

        this.mInjuredPeople = new sap.ui.model.json.JSONModel();
        this.loadInjuredPeople(this.id_local);
        this.mPeople = new sap.ui.model.json.JSONModel();        
        view.setModel(this.mInjuredPeople, "INJURED_PEOPLE");
		
        this.mInvolvedEquipment = new sap.ui.model.json.JSONModel();
		this.loadInvolvedEquipment(this.id_local);
        view.setModel(this.mInvolvedEquipment, "INVOLVED_EQUIPMENT");

        this.mInvolvedVehicle = new sap.ui.model.json.JSONModel();
        this.loadInvolvedVehicle(this.id_local);
        view.setModel(this.mInvolvedVehicle, "INVOLVED_VEHICLE");
		
		this.mInvolvedProperty = new sap.ui.model.json.JSONModel();
        this.loadInvolvedProperty(this.id_local);
        view.setModel(this.mInvolvedProperty, "INVOLVED_PROPERTY");
		
        this.mIncident = new sap.ui.model.json.JSONModel();
        view.setModel(this.mIncident, "INCIDENT_MODEL");
        this.loadIncident(this.id_local);

        /* this.mPriorityTypesModel = new sap.ui.model.json.JSONModel();
        view.byId("incident-reporting-priority").setModel(this.mPriorityTypesModel);
        this.loadPriorityTypes();*/

        this.mTimezoneList = new sap.ui.model.json.JSONModel();
        view.byId("incident-reporting-timezone").setModel(this.mTimezoneList);
        this.loadTimezoneList();

        this.mLocationList = new sap.ui.model.json.JSONModel();
        this.loadLocationList();

        var oDate = new Date();
        var timeZoneFullString = oDate.toString().match(/\(([A-Za-z\s].*)\)/)[1];
        var timeZoneShortString = timeZoneFullString.match(/\b(\w)/g).join("");
        view.byId("datePicker").setDateValue(oDate);
        view.byId("timePicker").setDateValue(oDate);
        view.byId("incident-reporting-timezone").setSelectedKey(timeZoneShortString);
    },

    getRouter: function() {
        return this.oRouter;
    },

    setRouter: function(oRouter) {
        this.oRouter = oRouter;
    },

    loadInjuredPeople: function(id_local){
        var self = this;
        var idFilter = [new sap.ui.model.Filter({
                path: "ID_LOCAL",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : id_local
            })];
        this.oModel.read("/Incident_Involved_People", {
                urlParameters: {$expand : "PERSON_DETAILS"},
                context: null,
                success: function(oResponseData, response) {

                    self.mInjuredPeople.setData(oResponseData.results);
                   // self.loadPeople();
                },
                filters: idFilter
            });
    },

    loadPeople: function(){
        var self = this;
        this.mPeople.oData = [];
        this.oModel.read("/People", {
            context: null,
            success: function(oResponseData, response) {
                oResponseData.results.forEach(function(person) {
                    if (!self.mInjuredPeople.getData().map(function(injuredPerson) {
                        return injuredPerson.PERSON_ID;
                    }).indexOf(person.PERSON_ID) > -1) {	
                        self.mPeople.oData.push(person);
                    }
                });
            }
        });
    },


    peoplePress: function(){
        var dialog = this.getPeopleDialog();
        dialog.open();
    },

    getPeopleDialog: function () {
        if (!this.peopleDialog) {
            this.peopleDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.people", this);
            this.peopleDialog.setModel(this.mPeople, "PEOPLE");
            this.getView().addDependent(this.peopleDialog);
        }
        return this.peopleDialog;
    },

    peopleCancel: function(){
        this.getPeopleDialog().close();
    },

    selectPerson: function(oControlEvent){
        this.local_persn_id = oControlEvent.getSource().getBindingContext("PEOPLE").getObject().LOCAL_PERSN_ID;
        this.getPeopleDialog().close().destroy();
        this.getRouter().navTo("create_new", { ID_LOCAL: this.id_local, LOCAL_PERSN_ID : this.local_persn_id});
    },

    filterPeople: function(oControlEvent){
        var oBinding = sap.ui.getCore().byId("peopleTable").getBinding("items");

        var query = oControlEvent.getParameters().newValue;


        var firstNameFilter = new sap.ui.model.Filter("FIRST_NAME","Contains", query || "");
        var lastNameFilter = new sap.ui.model.Filter("LAST_NAME","Contains", query || "");
        var addressFilter = new sap.ui.model.Filter("ADDRESS","Contains", query || "");
        var companyFilter = new sap.ui.model.Filter("COMPANY","Contains", query || "");
        var emailFilter = new sap.ui.model.Filter("EMAIL","Contains", query || "");

        var allFilter = new sap.ui.model.Filter([ firstNameFilter,lastNameFilter,addressFilter,companyFilter,emailFilter],false); 
        oBinding.filter(allFilter);
    },

    loadIncident: function(id_local){
        var self = this;
        this.oModel.read("/Reported_Incidents('" + id_local + "')", {
            context: null,
            success: function(oResponseData){
                self.mIncident.setData(oResponseData);
                self.userImagePromise = dep.fiori.lib.util.Utilities.getUserImage(self.mIncident.getProperty("/USER_ID_CR"));
                self.userImagePromise.then(function(v){self.mIncident.setProperty("/IMAGE", v.imageURL)});
            },
            error: function(oResponseData, response){

            }
        });
    },

/*    loadPriorityTypes: function() {
        var self = this;
        this.oModel.read("/Priority_Type", {
            context: null,
            success: function(oResponseData){
                self.mPriorityTypesModel.setData(oResponseData.results);
            },
            error: function(oResponseData, response){

            }
        });
    },*/

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
    /*
    loadTimezoneList: function() {
        var self = this;
        this.oModel.read("/Timezone", {
            context: null,
            success: function(oResponseData){
                self.mTimezoneList.setData(oResponseData.results);
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
			}			
        })
	}, 

    accidentLocationPress: function(){
        var dialog = this.getAccidentLocationDialog();
        dialog.open();
    },

    getAccidentLocationDialog: function () {
        if (!this.accidentLocationDialog) {
            this.accidentLocationDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.accidentLocation", this);
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
            this.orgUnitDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.orgUnit", this);
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
            this.accidentLocationClassificationDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.accidentLocationClassification", this);			
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
		this.mIncident.setProperty("/PLANT_LOC_CL_CODE",  locClassificationValue);
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
    handleMessagePopoverPress: function(oEvent){
        this.oMessagePopover.toggle(oEvent.getSource());
    },
	
	onUnknownTimeSelect: function(oEvent) {
		self = this;
		var sUnknownTime = oEvent.getParameter("selected") ? "X" : " ";
		this.mIncident.setProperty("/TIME_NOT_DET_IND", sUnknownTime);
		if (sUnknownTime = "X") {
			self.getView().byId("timePicker").setEnabled(false);
			self.getView().byId("incident-reporting-timezone").setEnabled(false);				
             			
		}
		if (!oEvent.getParameter("selected")) {
			self.getView().byId("timePicker").setEnabled(true);
			self.getView().byId("incident-reporting-timezone").setEnabled(true);	
		}
	},
	        
    createPeople: function() {
        var self = this;
        self.getRouter().navTo("createPeople", { ID_LOCAL: self.id_local});
    },
	loadInvolvedEquipment: function(id_local){
        var self = this;
        var idFilter = [new sap.ui.model.Filter({
                path: "ID_LOCAL",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : id_local
            })];
        this.oModel.read("/Incident_Involved_Equipment", {
               // urlParameters: {$expand : "ASSET_DAMAGE_EQUI"},
                context: null,
                success: function(oResponseData, response) {
                    self.mInvolvedEquipment.setData(oResponseData.results);
                },
                filters: idFilter
            });
    },
	createEquipment: function() {
		var self = this;
		self.getRouter().navTo("createEquipment", { ID_LOCAL: self.id_local});
    },
	loadInvolvedVehicle: function(id_local){
        var self = this;
        var idFilter = [new sap.ui.model.Filter({
                path: "ID_LOCAL",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : id_local
            })];
        this.oModel.read("/Incident_Involved_Vehicle", {
                context: null,
                success: function(oResponseData, response) {
                    self.mInvolvedVehicle.setData(oResponseData.results);
                },
                filters: idFilter
            });
    },
    
    createVehicle: function() {
        var self = this;
        self.getRouter().navTo("createVehicle", { ID_LOCAL: self.id_local});
    },
	
	loadInvolvedProperty: function(id_local){
        var self = this;
        var idFilter = [new sap.ui.model.Filter({
                path: "ID_LOCAL",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : id_local
            })];
        this.oModel.read("/Incident_Involved_Property", {
                context: null,
                success: function(oResponseData, response) {
                    self.mInvolvedProperty.setData(oResponseData.results);
                },
                filters: idFilter
            });
    },
    
    createProperty: function() {
        var self = this;
        self.getRouter().navTo("createProperty", { ID_LOCAL: self.id_local});
    },
    validate: function(){
        var flag = true;
        if (this.check) {
            this.mErrors.setData([]);
            var sTime = this.mIncident.getProperty("/START_TIME");
          //  var priority = this.getView().byId("incident-reporting-priority").getSelectedItem().getText();
            var timeZone = this.getView().byId("incident-reporting-timezone").getSelectedKey();
            var title = this.mIncident.getProperty("/TITLE");
            //var descOfEvent = this.mIncident.getProperty("/ELTXT");
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

            if ( timeZone && title) {
                //&& descOfEvent && accidentLoc) {
                this.getView().byId("incidentTitle").setValueState("None");
               // this.getView().byId("descriptionOfEvents").setValueState("None");
               // this.getView().byId("incident-reporting-location").setValueState("None");
               // this.getView().byId("incident-reporting-priority").setValueState("None");
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
                /* if (!descOfEvent) {
					this.getView().byId("descriptionOfEvents").setValueState("Error");
                } else {
                    this.getView().byId("descriptionOfEvents").setValueState("None");
                }
                if (!accidentLoc) {
                    this.getView().byId("incident-reporting-location").setValueState("Error");
                } else {
                    this.getView().byId("incident-reporting-location").setValueState("None");
                }
                if (!priority) {
                    this.getView().byId("incident-reporting-priority").setValueState("Error");
                } else {
                    this.getView().byId("incident-reporting-priority").setValueState("None");
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

   onSubmitPress: function(oControlEvent) {
        var submitReport = {};
        /*if(oControlEvent.getSource().getId() == "dep-fiori-reportedincidents-edit--submit-button"){			
           submitReport = {SUBMIT: "Y"};
        }*/
        submitReport = {SUBMIT: "Y"};
        this.check = true;
        var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");

      //  this.mIncident.setProperty("/PRIORITY", this.getView().byId("incident-reporting-priority").getSelectedKey());
        //this.mIncident.setProperty("/START_TIME_ZONE", this.getView().byId("incident-reporting-timezone").getSelectedKey());
        this.mIncident.setProperty("/USER_ID_CR", sap.ushell.Container.getUser().getId());
        this.mIncident.setProperty("/REPORTED_DATE", "00000000");
        
		var timeUnknown = this.mIncident.getData().TIME_NOT_DET_IND;
		if (timeUnknown == 'X') {
			this.mIncident.setProperty("/TIME_NOT_DET_IND", timeUnknown);
			this.mIncident.setProperty("/START_TIME_ZONE", "");
			this.mIncident.setProperty("/START_TIME", "");			
		}
		if (timeUnknown == '') {
			if (!this.validate()) {
				var aErrors = this.mErrors.getData();
				//display the first error message as a toast
				//will show a Date Error first, otherwise a Required Fields error
				sap.m.MessageToast.show(aErrors[0].SUBTITLE);
				return;
			}
			this.mIncident.setProperty("/START_TIME_ZONE", this.getView().byId("incident-reporting-timezone").getSelectedKey());
		}
		
        var self = this;
        this.oModel.create("/INCIDENT", self.mIncident.getData(), {
            headers: submitReport,
            context: null,
            success: function(oResponseData){
                oResponseData = oResponseData.results;
                if (oResponseData[0].ErrorID) {
                    sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                        closeOnBrowserNavigation: false
                    });
                } else {
                    sap.ushell.Container.setDirtyFlag(false);
                    
                    if (oResponseData[0].STATUS == "200") {
						self.mState.setProperty("/editing", false);
                        //sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.success", [oResponseData[0].OBJECT_KEY]), {
						sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.successSubmittedIncident"), {	
                            closeOnBrowserNavigation: false
                        });
						self.loadIncident(self.id_local);
                    } else if (oResponseData[0].STATUS == "409") {
                        self.getDuplicateIncDialog().open();
                    } else {
                        sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                            closeOnBrowserNavigation: false
                        });
                    }
                }
            },
            error: function(oResponseData, response){

            }
        });
    },
    
    getDuplicateIncDialog: function () {
        if (!this.duplicateIncDialog) {
            this.duplicateIncDialog = sap.ui.xmlfragment("dep.fiori.reportedincidents.app.duplicateincident", this);
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
		
	onEdit: function(oEvent) {
		   this.mState.setProperty("/editing", true);
        },

	onCancel: function(oEvent) {
		 this.mState.setProperty("/editing", false);
         this.loadIncident(this.id_local);
	},

	onSave: function(oEvent) {    
		var self = this;

		this.saveIncident(this.mIncident.getData()).done(function(oResponseData) {
			if (Array.isArray(oResponseData)) {
				oResponseData = oResponseData[0];
			}
            self.mState.setProperty("/editing", false);
            sap.ushell.Container.setDirtyFlag(false);
			self.loadIncident(self.id_local);
			
		}).fail(function() {
			sap.m.MessageToast.show(self.getText("Error.saveIncident"));
		});
    },
    
	saveIncident: function(oRequestData) {
		var self = this;
		return Utilities.showBusyIndicator($.ajax({
			url: "/ws_restful_ehs_data_controller/INCIDENT",
			method: "POST",
			data: self.mIncident.getJSON()
		}));
	},
	onSubmitConfirmationPress: function(oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var i18n = this.getView().getModel("i18n");			
			var self = this;
			sap.m.MessageBox.show(i18n.getProperty("Confirmation.submitIncidentMessage"), {
					icon: sap.m.MessageBox.Icon.CONFIRM,
					title: "Submit",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO], 
					onClose: function(oAction) { if(oAction == "YES") {self.onSubmitPress()}},
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		},	

	removePersonPress: function(oEvent) {
		self = this;
		this.local_persn_id = oEvent.getSource().getBindingContext("INJURED_PEOPLE").getObject().LOCAL_PERSN_ID;
		this.id_local = oEvent.getSource().getBindingContext("INJURED_PEOPLE").getObject().ID_LOCAL;
		this.mInvolvedPerson = new sap.ui.model.json.JSONModel();
		this.mInvolvedPerson.setProperty("/IS_EXTERNAL", "X");
		this.mInvolvedPerson.setProperty("/LOCAL_PERSN_ID", this.local_persn_id);
		var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
		
		Utilities.showBusyIndicator($.ajax({
				headers: {IRID: this.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_PARTY",
                method: "DELETE",
                data: JSON.stringify([ this.mInvolvedPerson.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                }				
                else if (oResponseData.STATUS === "200") {
					sap.ushell.Container.setDirtyFlag(false);
					sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeSuccess", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                    self.mInjuredPeople.refresh();
					self.loadInjuredPeople(self.id_local);					
                }					
				else if (oResponseData.STATUS === "409") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeFail", [oResponseData.OBJECT_KEY]), {
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
	removeEquipmentPress: function(oEvent) {
		self = this;
		this.asset_id = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_ID;
		this.asset_type = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_TYPE;
		this.asset_line_number = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ASSET_LINE_NO;
		this.id_local = oEvent.getSource().getBindingContext("INVOLVED_EQUIPMENT").getObject().ID_LOCAL;
		this.mInvolvedEquipment = new sap.ui.model.json.JSONModel();
		this.mInvolvedEquipment.setProperty("/ASSET_ID", this.asset_id );
		this.mInvolvedEquipment.setProperty("/ASSET_TYPE", this.asset_type);
		this.mInvolvedEquipment.setProperty("/ASSET_LINE_NO", this.asset_line_number);
		var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
		
		Utilities.showBusyIndicator($.ajax({
				headers: {IRID: this.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "DELETE",
                data: JSON.stringify([ this.mInvolvedEquipment.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                }				
                else if (oResponseData.STATUS === "200") {
					sap.ushell.Container.setDirtyFlag(false);
					sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeEquipmentSuccess", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                    self.mInvolvedEquipment.refresh();
					self.loadInvolvedEquipment(self.id_local); 
                    self.getView().setModel(self.mInvolvedEquipment, "INVOLVED_EQUIPMENT");							
                }					
				else if (oResponseData.STATUS === "409") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeEquipmentFail", [oResponseData.OBJECT_KEY]), {
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
	removeVehiclePress : function(oEvent) {
		self = this;
		this.assetID = oEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_ID;
		this.id_local = oEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ID_LOCAL;
		this.asset_type = oEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_TYPE;
		this.assetlineNo = oEvent.getSource().getBindingContext("INVOLVED_VEHICLE").getObject().ASSET_LINE_NO;
		
		this.mInvolvedVehicle = new sap.ui.model.json.JSONModel();
		this.mInvolvedVehicle.setProperty("/ASSET_ID", this.assetID);
		this.mInvolvedVehicle.setProperty("/ASSET_LINE_NO", this.assetlineNo);
		this.mInvolvedVehicle.setProperty("/ASSET_TYPE", this.asset_type);
		var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
		
		Utilities.showBusyIndicator($.ajax({
				headers: {IRID: this.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "DELETE",
                data: JSON.stringify([ this.mInvolvedVehicle.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                }				
                else if (oResponseData.STATUS === "200") {
					sap.ushell.Container.setDirtyFlag(false);
					sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeVehicleSuccess", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: true
                    });
                    self.mInvolvedVehicle.refresh();
					self.loadInvolvedVehicle(self.id_local);
					self.getView().setModel(self.mInvolvedVehicle, "INVOLVED_VEHICLE");					
                }					
				else if (oResponseData.STATUS === "409") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removeVehicleFail", [oResponseData.OBJECT_KEY]), {
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
	removePropertyPress : function(oEvent) {
		self = this;
		this.assetID = oEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ASSET_ID;
		this.id_local = oEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ID_LOCAL;
		this.assetlineNo = oEvent.getSource().getBindingContext("INVOLVED_PROPERTY").getObject().ASSET_LINE_NO;
		
		this.mInvolvedProperty = new sap.ui.model.json.JSONModel();
		this.mInvolvedProperty.setProperty("/ASSET_ID", this.assetID);
		this.mInvolvedProperty.setProperty("/ASSET_LINE_NO", this.assetlineNo);
		this.mInvolvedProperty.setProperty("/ASSET_TYPE", "003");
		var i18n = this.getView().getModel("i18n");
        var i18nGlobal = this.getView().getModel("i18nGlobal");
		
		Utilities.showBusyIndicator($.ajax({
				headers: {IRID: this.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_ASSET",
                method: "DELETE",
                data: JSON.stringify([ this.mInvolvedProperty.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                }				
                else if (oResponseData.STATUS === "200") {
					sap.ushell.Container.setDirtyFlag(false);
					sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removePropertySuccess", [oResponseData.OBJECT_KEY]), {
                        closeOnBrowserNavigation: true
                    });
                    self.mInvolvedProperty.refresh();
					self.loadInvolvedProperty(self.id_local);
					self.getView().setModel(self.mInvolvedProperty, "INVOLVED_PROPERTY");					
                }					
				else if (oResponseData.STATUS === "409") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.removePropertyFail", [oResponseData.OBJECT_KEY]), {
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
        iconFormatter: function(status_key){
            if(status_key === "1"){
                return "sap-icon://to-be-reviewed"
            }else if(status_key === "2"){
                return "sap-icon://status-critical"
            }else if(status_key === "3"){
                return "sap-icon://status-completed";
            }
        },
        iconColorFormatter: function(status_key){
            if(status_key === "1"){
                return "#27A3DD"
            }else if(status_key === "2"){
                return "#DE890D"
            }else if(status_key === "3"){
                return "#61A656";
            }
        },
        listTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("InjuredPeopleList.count", [itemCount]);
            }
            return null;
        },
        vehicleListTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("VehicleList.count", [itemCount]);
            }
            return null;
        },
        nameInitials: function(firstName, lastName){
            if(firstName === undefined || lastName === undefined){
                return;
            }
            return firstName.substring(0,1) + lastName.substring(0,1);
        },
		equipmentsListTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("EquipmentsList.count", [itemCount]);
            }
            return null;
        },
		propertiesListTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("PropertiesList.count", [itemCount]);
            }
            return null;
        }
    }

});
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.ErrorPopover));