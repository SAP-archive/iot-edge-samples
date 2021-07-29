jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("sap.m.MessageBox");

//sap.ui.controller("dep.fiori.reportedincidents.app.create", {
(function(CreateControllerBase, Utilities) {
    CreateControllerBase.extend("dep.fiori.reportedincidents.app.create", {	

    onInit: function () {
    	this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		CreateControllerBase.prototype.onInit.apply(this, arguments);
        this.mInvolvedPerson = this.getObjectModel();	
    },    
    
    onRouteMatched: function (oEvent) {
        this.mInjuredPerson = new sap.ui.model.json.JSONModel();
        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
        if (oEvent.getParameter("name") === "create") {
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;
            this.local_persn_id = oEvent.getParameters().arguments.LOCAL_PERSN_ID;
            if (this.id_local) {
                this.loadInjuredPerson(this.id_local, this.local_persn_id);
                this.onInitAfterRoute();
            }
        } else if (oEvent.getParameter("name") === "create_new") {
            this.id_local = oEvent.getParameters().arguments.ID_LOCAL;
            this.local_persn_id = oEvent.getParameters().arguments.LOCAL_PERSN_ID;
            if (this.id_local) {
                this.loadPerson(this.local_persn_id);
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
	/* don't need it anymore since service now provides IS_SUBMITTED
	// hide and show edit icon based on incident status
	loadIncident: function(id_local){
		this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/ehs/odata");
		this.mIncident = new sap.ui.model.json.JSONModel();
        var self = this;
        this.oModel.read("/Reported_Incidents('" + id_local + "')", {
            context: null,
            success: function(oResponseData){
                self.mIncident.setData(oResponseData);	
                var incidentStatus = self.mIncident.getProperty("/IS_SUBMITTED");
                if (incidentStatus == "X") {
					self.getView().byId("personEditButton").setVisible(false);
				}
                else {
					self.getView().byId("personEditButton").setVisible(true);
				}				
            },
            error: function(oResponseData, response){

            }
        });
    },
	*/
    
    onInitAfterRoute: function() {       
        //this.loadIncident(this.id_local);
        this.mPeople = new sap.ui.model.json.JSONModel();
        this.mWorkRelatedList = new sap.ui.model.json.JSONModel();
        this.mClassificationList = new sap.ui.model.json.JSONModel();
        this.mBodyPart = new sap.ui.model.json.JSONModel();
        this.mBodySide = new sap.ui.model.json.JSONModel();
        this.mInjuryType = new sap.ui.model.json.JSONModel();

        this.loadPeople();
        this.loadWorkRelatedList();
        this.loadClassificationList();
        this.loadBodyPartList();
        this.loadBodySideList();
        this.loadInjuryTypeList();

        this.mInfluencingFactorsCategories = new sap.ui.model.json.JSONModel();
        this.mInfluencingFactors = new sap.ui.model.json.JSONModel();
        this.mInfluencingFactorsMain = new sap.ui.model.json.JSONModel();
        this.mInjuredPeopleInfluecingFactors = new sap.ui.model.json.JSONModel();

        this.loadInfluencingFactors(this.id_local, this.local_persn_id);

        this.getView().setModel(this.mInjuredPerson, "INJURED_PERSON");
        this.getView().setModel(this.mInjuredPeopleInfluecingFactors, "INJURED_PEOPLE_INFLUENCING_FACTORS");
		
		this.mState = new sap.ui.model.json.JSONModel({ editing: false });
        this.getView().setModel(this.mState, "state");
		
		this.mIncident = new sap.ui.model.json.JSONModel();
    },

    loadInjuredPerson: function(id_local, local_persn_id){
        var self = this;
        //this.oModel.read("/Incident_Injured_People(" + "ID_LOCAL='" + id_local + "',LOCAL_PERSN_ID='" + local_persn_id + "')", {
		this.oModel.read("/Incident_Involved_People(" + "ID_LOCAL='" + id_local + "',LOCAL_PERSN_ID='" + local_persn_id + "')", {	
                urlParameters: {$expand : "PERSON_DETAILS"},
                context: null,
                success: function(oResponseData, response) {
                    self.mInjuredPerson.setData(oResponseData);
                }
            });
    },

    loadInfluencingFactors: function(id_local, local_persn_id){
        var self = this;
        this.oModel.read("/Influencing_Factors", {
                context: null,
                success: function(oResponseData, response) {

                	//have a model that has all of the influencing factors
                	self.mInfluencingFactorsMain.setData(oResponseData.results);

                	//remove duplicates for model that just has factor categories
                	oResponseData = oResponseData.results;
					var new_arr = [];
					var lookup = {};
					for (var i in oResponseData) {
					    lookup[oResponseData[i]["INFLUEN_FACTOR_CAT_ID"]] = oResponseData[i];
					}
					for (i in lookup) {
					    new_arr.push(lookup[i]);
					}
                    self.mInfluencingFactorsCategories.setData(new_arr);
                }
            });

        var influencingFactorsFilters = [new sap.ui.model.Filter({
                path: "LOCAL_PERSN_ID",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : local_persn_id
            }), new sap.ui.model.Filter({
                path: "ID_LOCAL",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : id_local
            })];
        this.oModel.read("/Injured_People_Influencing_Factors", {
        		urlParameters: {$orderby : "LINE_NUMBER desc"},
                context: null,
                success: function(oResponseData, response) {
                    self.mInjuredPeopleInfluecingFactors.setData(oResponseData.results);
                },
                filters: influencingFactorsFilters
            });
    },

    loadSpecificInfluencingFactors: function(category){
    	var self = this;
    	var influencingFactorsFilter = [new sap.ui.model.Filter({
                path: "INFLUEN_FACTOR_CAT_ID",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : category
            })];
    	this.oModel.read("/Influencing_Factors", {
                context: null,
                success: function(oResponseData, response) {
                	self.mInfluencingFactors.setData(oResponseData.results);
                },
                filters: influencingFactorsFilter
            });
    },

    loadPeople: function(){
        var self = this;
        this.oModel.read("/People", {
                context: null,
                success: function(oResponseData, response) {

                    self.mPeople.setData(oResponseData.results);
                }
            });
    },

    loadWorkRelatedList: function(){
        var self = this;
        this.oModel.read("/Work_Related", {
                context: null,
                success: function(oResponseData, response) {
                    self.mWorkRelatedList.setData(oResponseData.results);
                }
            });
    },

    loadClassificationList: function(){
        var self = this;
        this.oModel.read("/Injury_Class", {
                context: null,
                success: function(oResponseData, response) {
                    self.mClassificationList.setData(oResponseData.results);
                }
            });
    },

    loadBodyPartList: function(){
        var self = this;
        this.oModel.read("/Body_Part", {
                context: null,
                success: function(oResponseData, response) {
                    self.mBodyPart.setData(oResponseData.results);
                }
            });
    },

    loadBodySideList: function(){
        var self = this;
        this.oModel.read("/Body_Side", {
                context: null,
                success: function(oResponseData, response) {
                    self.mBodySide.setData(oResponseData.results);
                }
            });
    },

    loadInjuryTypeList: function(){
        var self = this;
        this.oModel.read("/Injury_Type", {
                context: null,
                success: function(oResponseData, response) {
                    self.mInjuryType.setData(oResponseData.results);
                }
            });
    },

    loadPerson: function(local_persn_id){
        var self = this;
        this.oModel.read("/People('" + local_persn_id + "')", {
                context: null,
                success: function(oResponseData, response) {

                    self.mInjuredPerson.setProperty("/PERSON_DETAILS", oResponseData);
                }
            });
    },

    peoplePress: function(){
        var dialog = this.getPeopleDialog();
        dialog.open();
    },

    workRelatedListPress: function(){
        var dialog = this.getWorkRelatedListDialog();
        dialog.open();
    },

    ClassificationPress: function(){
        var dialog = this.getClassificationDialog();
        dialog.open();
    },

    BodyPartPress: function(){
        var dialog = this.getBodyPartDialog();
        dialog.open();
    },

    BodySidePress: function(){
        var dialog = this.getBodySideDialog();
        dialog.open();
    },

    InjuryTypePress: function(){
        var dialog = this.getInjuryTypeDialog();
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

    getWorkRelatedListDialog: function () {
        if (!this.workRelatedListDialog) {
            this.workRelatedListDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.workRelatedList", this);
            this.workRelatedListDialog.setModel(this.mWorkRelatedList,"WORK_RELATED_LIST");
            this.getView().addDependent(this.workRelatedListDialog);
        }
        return this.workRelatedListDialog;
    },

    getClassificationDialog: function () {
        if (!this.classificationDialog) {
            this.classificationDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.classification", this);
            this.classificationDialog.setModel(this.mClassificationList, "CLASSIFICATION_LIST");
            this.getView().addDependent(this.classificationDialog);
        }
        return this.classificationDialog;
    },

    getBodyPartDialog: function () {
        if (!this.bodyPartDialog) {
            this.bodyPartDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.bodypart", this);
            this.bodyPartDialog.setModel(this.mBodyPart, "BODY_PART");
            this.getView().addDependent(this.bodyPartDialog);
        }
        return this.bodyPartDialog;
    },

    getBodySideDialog: function () {
        if (!this.bodySideDialog) {
            this.bodySideDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.bodyside", this);
            this.bodySideDialog.setModel(this.mBodySide, "BODY_SIDE");
            this.getView().addDependent(this.bodySideDialog);
        }
        return this.bodySideDialog;
    },

    getInjuryTypeDialog: function () {
        if (!this.injuryTypeDialog) {
            this.injuryTypeDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.injuryType", this);
            this.injuryTypeDialog.setModel(this.mInjuryType, "INJURY_TYPE");
            this.getView().addDependent(this.injuryTypeDialog);
        }
        return this.injuryTypeDialog;
    },

    peopleCancel: function(){
        this.getPeopleDialog().close();
    },

    WorkRelatedListCancel: function(){
        this.workRelatedListDialog.close();
    },

    classificationListCancel: function(){
        this.classificationDialog.close();
    },

    bodyPartListCancel: function(){
        this.bodyPartDialog.close();
    },

    bodySideListCancel: function(){
        this.bodySideDialog.close();
    },

    injuryTypeListCancel: function(){
        this.injuryTypeDialog.close();
    },

    selectPerson: function(oControlEvent){
    	this.local_persn_id = oControlEvent.getSource().getBindingContext("PEOPLE").getObject().LOCAL_PERSN_ID;
    	this.loadPerson(this.local_persn_id);
    	
    	this.getPeopleDialog().close();
    },

    selectWorkRelatedList: function(oControlEvent){
        workRelatedID = oControlEvent.getSource().getBindingContext("WORK_RELATED_LIST").getObject().WORK_RELATED_CAT;
        // this.mInjuredPerson.setProperty("",);
        this.mInjuredPerson.setProperty("/WORK_RELATED_CAT", workRelatedID);
        this.mInjuredPerson.refresh();
        this.getWorkRelatedListDialog().close();
    },

    selectClassificationList: function(oControlEvent){
        injuryID = oControlEvent.getSource().getBindingContext("CLASSIFICATION_LIST").getObject().INJURY_CLASS_ID;
        this.mInjuredPerson.setProperty("/INJURY_CLASS_ID", injuryID);
        this.mInjuredPerson.refresh();
        this.getClassificationDialog().close();
    },

    selectBodyPartList: function(oControlEvent){
        bodyPart = oControlEvent.getSource().getBindingContext("BODY_PART").getObject().BODYPART;
        this.mInjuredPerson.setProperty("/BODYPART", bodyPart);
        this.mInjuredPerson.refresh();
        this.getBodyPartDialog().close();
    },

    selectBodySideList: function(oControlEvent){
        bodySide = oControlEvent.getSource().getBindingContext("BODY_SIDE").getObject().BODYSIDE;
        this.mInjuredPerson.setProperty("/BODYSIDE", bodySide);
        this.mInjuredPerson.refresh();
        this.getBodySideDialog().close();
    },

    selectInjuryTypeList: function(oControlEvent){
        injuryType = oControlEvent.getSource().getBindingContext("INJURY_TYPE").getObject().INJURY_TYPE_ID;
        this.mInjuredPerson.setProperty("/INJURY_TYPE_ID", injuryType);
        this.mInjuredPerson.refresh();
        this.getInjuryTypeDialog().close();
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

    factorCategoryPress: function(oControlEvent){
    	var dialog = this.getFactorCategoryDialog();
    	this.selectedRow = oControlEvent.getSource().getBindingContext("INJURED_PEOPLE_INFLUENCING_FACTORS").sPath;
        dialog.open();
    },

    getFactorCategoryDialog: function () {
        if (!this.factorCategoryDialog) {
            this.factorCategoryDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.factorcategory", this);
            this.factorCategoryDialog.setModel(this.mInfluencingFactorsCategories, "INFLUENCING_FACTORS_CATEGORIES");
            this.getView().addDependent(this.factorCategoryDialog);
        }
        return this.factorCategoryDialog;
    },

    factorCategoryCancel: function(){
    	this.getFactorCategoryDialog().close();
    },

    addInflucingFactorCategory: function(oControlEvent){
    	var influen_factor_id = oControlEvent.getSource().getBindingContext("INFLUENCING_FACTORS_CATEGORIES").getObject().INFLUEN_FACTOR_CAT_ID;
    	this.mInjuredPeopleInfluecingFactors.setProperty(this.selectedRow + "/INFLUEN_FACTOR_CAT_ID", influen_factor_id);
    	this.mInjuredPeopleInfluecingFactors.setProperty(this.selectedRow + "/INFLUEN_FACTOR_ID", "");
    	this.getFactorCategoryDialog().close();
    },

    filterFactorCategory: function(oControlEvent){
    	var oBinding = sap.ui.getCore().byId("factorCategoryCancelTable").getBinding("items");

        var query = oControlEvent.getParameters().newValue;

        var factorCatId = new sap.ui.model.Filter("INFLUEN_FACTOR_CAT_ID","Contains", query || "");

        var allFilter = new sap.ui.model.Filter([ factorCatId ],false); 
        oBinding.filter(allFilter);

    },

    influencingFactorPress: function(oControlEvent){
    	var dialog = this.getInfluencingFactorDialog();
    	this.selectedRow = oControlEvent.getSource().getBindingContext("INJURED_PEOPLE_INFLUENCING_FACTORS").sPath;
    	this.loadSpecificInfluencingFactors(this.mInjuredPeopleInfluecingFactors.getProperty(this.selectedRow + "/INFLUEN_FACTOR_CAT_ID"));
        dialog.open();

    },

    getInfluencingFactorDialog: function () {
        if (!this.influencingFactorDialog) {
            this.influencingFactorDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.influencingfactor", this);
            this.influencingFactorDialog.setModel(this.mInfluencingFactors, "INFLUENCING_FACTORS");
            this.getView().addDependent(this.influencingFactorDialog);
        }
        return this.influencingFactorDialog;
    },

    influencingFactorCancel: function(){
    	this.getInfluencingFactorDialog().close();
    },

    addInfluencingFactor: function(oControlEvent){
    	var influen_factor_id = oControlEvent.getSource().getBindingContext("INFLUENCING_FACTORS").getObject().INFLUEN_FACTOR_ID;
    	this.mInjuredPeopleInfluecingFactors.setProperty(this.selectedRow + "/INFLUEN_FACTOR_ID", influen_factor_id);
    	this.getInfluencingFactorDialog().close();
    },

    filterInfluencingFactors: function(oControlEvent){
    	var oBinding = sap.ui.getCore().byId("influencingFactorsDialog").getBinding("items");

        var query = oControlEvent.getParameters().newValue;

        var infFactorId = new sap.ui.model.Filter("INFLUEN_FACTOR_ID","Contains", query || "");
        var infFactorDesc = new sap.ui.model.Filter("INFLUEN_FACTOR_DESC","Contains", query || "");

        var allFilter = new sap.ui.model.Filter([ infFactorId, infFactorDesc ],false); 
        oBinding.filter(allFilter);
    },


    influencingFactorAddPress: function(oControlEvent){
    	var dialog = this.getInfluencingFactorAddDialog();
        dialog.open();

    },

    getInfluencingFactorAddDialog: function () {
        if (!this.influencingFactorAddDialog) {
            this.influencingFactorAddDialog = new sap.ui.xmlfragment("dep.fiori.reportedincidents.app.influencingfactoradd", this);
            this.influencingFactorAddDialog.setModel(this.mInfluencingFactorsMain, "INFLUENCING_FACTORS_ADD");
            this.getView().addDependent(this.influencingFactorAddDialog);
        }
        return this.influencingFactorAddDialog;
    },

    influencingFactorAddCancel: function(){
    	this.getInfluencingFactorAddDialog().close();
    },

    addFactorMain: function(oControlEvent){
    	var influen_factor_cat_id = oControlEvent.getSource().getBindingContext("INFLUENCING_FACTORS_ADD").getObject().INFLUEN_FACTOR_CAT_ID;
    	var influen_factor_id = oControlEvent.getSource().getBindingContext("INFLUENCING_FACTORS_ADD").getObject().INFLUEN_FACTOR_ID;

    	//line numbers are ordered so we can just add +1 to length of list
    	var line_number = this.mInjuredPeopleInfluecingFactors.getData().length + 1;

    	this.mInjuredPeopleInfluecingFactors.getData().push({INFLUEN_FACTOR_CAT_ID: influen_factor_cat_id, 
    		INFLUEN_FACTOR_ID: influen_factor_id, LINE_NUMBER: line_number});
    	this.mInjuredPeopleInfluecingFactors.refresh();

    	this.getInfluencingFactorAddDialog().close();
    },

    filterInfluencingFactorsAdd: function(oControlEvent){
    	var oBinding = sap.ui.getCore().byId("influencingFactorsAddDialog").getBinding("items");

        var query = oControlEvent.getParameters().newValue;

        var infFactorCatId = new sap.ui.model.Filter("INFLUEN_FACTOR_CAT_ID","Contains", query || "");
        var infFactorId = new sap.ui.model.Filter("INFLUEN_FACTOR_ID","Contains", query || "");
        var infFactorDesc = new sap.ui.model.Filter("INFLUEN_FACTOR_DESC","Contains", query || "");

        var allFilter = new sap.ui.model.Filter([ infFactorCatId, infFactorId, infFactorDesc ],false); 
        oBinding.filter(allFilter);
    },


    removeInfluencingFactor: function(oControlEvent){
    	//factors are gauranteed to be ordered
    	var selectedRow = oControlEvent.getSource().getBindingContext("INJURED_PEOPLE_INFLUENCING_FACTORS").sPath;
    	//decrease line numbers of proceeding influencing factors by 1
    	for(var x = parseInt(selectedRow.substring(1,2)) + 1; x < this.mInjuredPeopleInfluecingFactors.getData().length; x++){
    		this.mInjuredPeopleInfluecingFactors.setProperty("/" + x + "/LINE_NUMBER",
    			parseInt(this.mInjuredPeopleInfluecingFactors.getProperty("/" + x + "/LINE_NUMBER")) - 1);
    	}
    	//finally remove the influencing factor
    	this.mInjuredPeopleInfluecingFactors.getData().splice(parseInt(selectedRow.substring(1,2)), 1);
    	this.mInjuredPeopleInfluecingFactors.refresh();
    },
    onPersonEdit: function(oEvent) {
		   this.mState.setProperty("/editing", true);
        },

	onPersonCancel: function(oEvent) {
		 this.mState.setProperty("/editing", false);
		 this.loadInjuredPerson(this.id_local, this.local_persn_id);
        // this.loadIncident(this.id_local);
	},

    onPersonSave: function(oEvent) {
			/*var bValid = this.validateRequiredFields();
            if (!bValid) {
                sap.m.MessageToast.show(this.getText("Error.ERR1"));
                return;
            }/*/
            var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var personLocalId = sHash.substring(sHash.lastIndexOf('/') + 1);
            var firstNameValue = this.getView().byId("firstName").getValue();
			var lastNameValue = this.getView().byId("lastName").getValue();
			var orgUnitValue = this.getView().byId("personOrgUnitID").getValue();
			var companyValue = this.getView().byId("company").getValue();
			var addressValue = this.getView().byId("address").getValue();
			var phoneValue = this.getView().byId("phone").getValue();
			var emailValue = this.getView().byId("email").getValue();
			var injuredDescValue = this.getView().byId("injuredDescription").getValue();
 			
			var oRadioGroup = sap.ui.getCore().byId("dep-fiori-reportedincidents-create--involvedPersonType");     
			var selectedPersonType = oRadioGroup.getSelectedIndex();
			var bSelectedType;
			if (selectedPersonType == 0) {
				bSelectedType = "EHHSS_PR_INJURED_PER"				
			}
			else if(selectedPersonType == 1) {
				bSelectedType =  "EHHSS_PR_WITNESS";
			}            			
			var oRequestData = Object.assign({
				LOCAL_PERSN_ID: personLocalId,
                FIRST_NAME: firstNameValue,
                LAST_NAME: lastNameValue,
                ADDRESS: addressValue,
                EMAIL: emailValue,
                PHONE: phoneValue,
                COMPANY: companyValue,
                ORG: orgUnitValue,
				INJURY_DESCRIPTION: injuredDescValue,
                INVOLVE_TYPE_ID: bSelectedType,
                IS_EXTERNAL: "X"
            }, this.mInvolvedPerson.getData());
			var self = this;
            Utilities.showBusyIndicator($.ajax({
				headers: {IRID: self.id_local},
                url: "/ws_restful_ehs_data_controller/INVOLVED_PARTY",
                method: "POST",
			   data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("Toast.otherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("Toast.updateSuccess"), {
                        closeOnBrowserNavigation: false
                    });
					self.mState.setProperty("/editing", false);
					sap.ushell.Container.setDirtyFlag(false);
					var sHash = "#depIncident-list&/create/" + self.id_local + "/" + personLocalId;
					Utilities.navToExternal(sHash);
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("Toast.communicationError"));
            }));
        },
    onSavePress: function(oControlEvent) {
        var i18n = this.getView().getModel("i18n");
        var self = this;
        this.mInjuredPerson.setProperty("/IS_EXTERNAL", '');
        this.mInjuredPerson.setProperty("/INJURY_DESCRIPTION", this.mInjuredPerson.getData().DESC_TXT);
        this.mInjuredPerson.setProperty("/FATALITY", "");
        this.mInjuredPerson.setProperty("/UNCONSCIOUSNESS", "X");
        this.mInjuredPerson.setProperty("/IMMEDIATE_RESUSCITATION", "X");
        this.mInjuredPerson.setProperty("/TREATMENT_BEYOND_FIRSTAID", "X");

        var personDetails = this.mInjuredPerson.getProperty("/PERSON_DETAILS");
        delete personDetails.__metadata;
        delete this.mInjuredPerson.oData.PERSON_DETAILS;
        Object.assign(this.mInjuredPerson.oData, personDetails);

        this.oModel.create("/Incident_Injured_People", [self.mInjuredPerson.getData()], {
		//  this.oModel.create("/ws_restful_ehs_data_controller/INVOLVED_PARTY", [self.mInjuredPerson.getData()], { 
            headers: {SUBMIT: "Y", IRID: self.id_local},
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
                        sap.m.MessageToast.show(i18n.getResourceBundle().getText("InjuredPersonToast.success", [oResponseData[0].OBJECT_KEY]), {
                            closeOnBrowserNavigation: false
                        });
                    } else if (oResponseData[0].STATUS == "409") {
                        // self.getDuplicateIncDialog().open();
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

    checkBoxClick: function(oControlEvent){
        var tooltipOfTheCheckbox = oControlEvent.getSource().mAggregations.tooltip;
        var ifSelected = oControlEvent.getParameters().selected;
        if(ifSelected == true){
            ifSelected = "X";
        }else{
            ifSelected = null;
        }
        if(tooltipOfTheCheckbox == "Unconsciousness"){
            this.mInjuredPerson.setProperty("/UNCONSCIOUS", ifSelected);
        }else if(tooltipOfTheCheckbox == "Treatment Beyond First Aid"){
            this.mInjuredPerson.setProperty("/TREATBEYONDFA", ifSelected);
        }else if(tooltipOfTheCheckbox == "Immediate Resuscitation"){
            this.mInjuredPerson.setProperty("/RESUSCITATION", ifSelected);
        }else if(tooltipOfTheCheckbox == "Fatality"){
            this.mInjuredPerson.setProperty("/FATAFLG", ifSelected);
        }
    },
    
    formatters : {
        nameInitials: function(firstName, lastName){
        	if(firstName === undefined || lastName === undefined){
        		return;
        	}
            return firstName.substring(0,1) + lastName.substring(0,1);
        },

        checkBoxFormatter: function(checkBoxString){
            if(checkBoxString == "X"){
                return true;
            }
            return false;
        }
    }
});
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.ErrorPopover));