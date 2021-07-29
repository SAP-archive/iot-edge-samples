jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.MessageViewDialog");
jQuery.sap.require("dep.fiori.lib.util.UserStatus");
jQuery.sap.require("sap.m.MessageBox");

(function(ListControllerBase, Filter, Utilities,MessageViewDialog, UserStatus) {
    ListControllerBase.extend("dep.fiori.reportedincidents.app.enter", {
    
        onInit: function() {
        	this.setSortFragment("dep.fiori.reportedincidents.app.listSort");
            this.setKey("ID_LOCAL");
            this.setODataServiceUrl("/dep/ehs/odata");
            this.setTable(this.byId("reported-incidents-table"));
            this.setDetailRoute("edit");
            ListControllerBase.prototype.onInit.apply(this, arguments);
    
            this.mPageVisibility = new sap.ui.model.json.JSONModel();
            this.mPageVisibility.setData("table");
            this.getView().setModel(this.mPageVisibility, "pageVisibility");
            
            this.getView().setModel(new sap.ui.model.json.JSONModel([
				{ key: "Draft", text: this.getText("Status.draft") },
				{ key: "New", text: this.getText("Status.new") },
                { key: "Process", text: this.getText("Status.inProcess") },
                { key: "Complete", text: this.getText("Status.completed") },
				{ key: "Submitted", text: this.getText("Status.submitted") },
				{ key: "Reopened", text: this.getText("Status.reopened") },
				{ key: "Void", text: this.getText("Status.void") }
            ]), "statuses");
        },
        
        onRouteMatched: function(oEvent) {
            var self = this;
            var sRoute = oEvent.getParameter("name");
    
            this.mIncidents = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mIncidents, "INCIDENTS");
    
            var aFilters;
    
            if (sRoute === "enter") {
                aFilters = [new sap.ui.model.Filter({
                    path: "IS_SUBMITTED",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : 'X'
                })];
            } else if (sRoute === "myincidents") {
                aFilters = [new sap.ui.model.Filter({
                    path: "USER_ID_CR",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : sap.ushell.Container.getUser().getId()
                })];
            }
            
            var oBinding = this.getTable().getBinding("items");
            oBinding.filter(aFilters);
    
            //this.getView().getModel("ODATA_MODEL").read("/Reported_Incidents", {
            //        context: null,
            //        success: function(oResponseData, response) {
            //            self.mIncidents.setData(oResponseData.results);
            //        },
            //        filters: filter
            //    });
        },
        
        onCreateIncidentPress: function(oEvent) {
            var sHash = "#depIncident-report" 
            Utilities.navToExternal(sHash);
        },
    
    	onRefresh: function(oEvent){
			var self = this;
			var bAsync = !!this.mIncidents.getData();
			this.mIncidents.setData({
				Incidents: []
			});
			Utilities.showBusyIndicator($.ajax({
				url: "/dep/ehs/odata/Reported_Incidents",
				async: bAsync
			}).done(function(aResponseData) {
				self.mIncidents.setData({
					Incidents: aResponseData
				});
				self.getView().byId('reported-incidents-table').getBinding("items").refresh(true);
				self.getView().setModel(self.mIncidents, "INCIDENTS")
			}));
			
    	},
    	
        tableTitleFormatter: function(iCount) {
            if (typeof(iCount) !== "number") {
                iCount = 0;
            }
            var i18n = this.getView().getModel("i18n");
            if (i18n) {
                return i18n.getResourceBundle().getText("ReportedIncidentList.count", [iCount]);
            }
            return "";
        },
    
        showTable: function() {
            this.mPageVisibility.setData("table");
        },
    
        showCharts: function() {
            this.initializeCharts();
            this.mPageVisibility.setData("chart");
        },
    
        showTableFormatter: function(sShowSection) {
            if (sShowSection === "table") {
                return true;
            }
            return false;
        },
        
        showChartsFormatter: function(sShowSection) {
            if (sShowSection === "chart") {
                return true;
            }
            return false;
        },
    
        statusIconSrcFormatter: function(statusCode) {
            if (statusCode === "1") {
                return "sap-icon://to-be-reviewed";
            } else if (statusCode === "2") {
                return "sap-icon://status-critical";
            } else if (statusCode === "3") {
                return "sap-icon://status-completed";
            }
            return "";
        },
    
        statusIconColorFormatter: function(statusCode) {
            if (statusCode === "1") {
                return sap.ui.core.IconColor.Default;
            } else if (statusCode === "2") {
                return sap.ui.core.IconColor.Critical;
            } else if (statusCode === "3") {
                return sap.ui.core.IconColor.Positive;
            }
            return "";
        },
    
        /*priorityTextFormatter: function(priorityCode) {
            if (priorityCode === "1") {
                return "L";
            } else if (priorityCode === "2") {
                return "M";
            } else if (priorityCode === "3") {
                return "H";
            }
            return "";
        },
    
        priorityTextClassFormatter: function(priorityCode) {
            if (priorityCode === "1") {
                return "lowPriorityIcon";
            } else if (priorityCode === "2") {
                return "mediumPriorityIcon";
            } else if (priorityCode === "3") {
                return "highPriorityIcon";
            }
            return "";
        },*/
    
        // Drafts currently have a "start date" while submitted reports have a "reported date"
        incidentFormatter: function(rawStartDate) {
            return Utilities.formatters.date(rawStartDate);
        },
    
        initializeCharts: function() {
            if (!this.chartsInitialized) {
                //this.initPieChart();
                this.initColumnChart();
                this.chartsInitialized = true;
            }
        },
    
        /*initPieChart: function (argument) {
            var mOpenReportPriority = new sap.ui.model.json.JSONModel("/ws_restful_ehs_data_controller/open_report_priority");
            this.getView().setModel(mOpenReportPriority, "openReportPriorityChart");
    
            var mPriorities = new sap.ui.model.json.JSONModel();
            this.getView().setModel(mPriorities, "openReportPriority");
    
            mOpenReportPriority.attachRequestCompleted(function(oEvent) {
                var aData = oEvent.getSource().getData();
                var oData = {
                    "3": 0, // High
                    "2": 0, // Medium
                    "1": 0 // Low
                };
                for (var i = 0; i < aData.length; i++) {
                    oData[aData[i].PRIORITY_KEY] = aData[i].TOTAL_REPORTS;
                }
                mPriorities.setData(oData);
            });
    
            var mPieProperties = new sap.ui.model.json.JSONModel({
                general: {
                    layout: { padding: 0 }
                },
                tooltip: { visible: false },
                interaction: {
                    selectability: { mode: "SINGLE" }
                },
                legend: { visible: false },
                title: { visible: false },
                plotArea: {
                    background: {
                        visible: false,
                        border: { strokeWidth: 0 }
                    },
                    dataPoint: {
                        stroke: { visible: false }
                    },
                    highlight: {
                        contextInfos: [
                            {
                                ctx: { Priority: "3" },
                                paras: { color: "#E22525" }
                            },
                            {
                                ctx: { Priority: "2"   },
                                paras: { color: "#F8A70E" }
                            },
                            {
                                ctx: { Priority: "1" },
                                paras: { color: "#008A11" }
                            }
                        ]
                    }
                }
            });
            this.getView().setModel(mPieProperties, "pieChartProperties");
        },*/
    
        currentYearReportStatus: function(sText) {
            return sText.replace("{0}", new Date().getFullYear());
        },
    
        initColumnChart: function () {
            var mReportStatusChart = new sap.ui.model.json.JSONModel("/ws_restful_ehs_data_controller/current_year_report_status");
            this.getView().setModel(mReportStatusChart, "reportStatusChart");
    
            var mStatuses = new sap.ui.model.json.JSONModel();
            this.getView().setModel(mStatuses, "reportStatus");
    
            mReportStatusChart.attachRequestCompleted(function(oEvent) {
                var aData = oEvent.getSource().getData();
                var oData = {
                    "1": 0, // New
                    "2": 0, // In Progress
                    "3": 0 // Completed
                };
                for (var i = 0; i < aData.length; i++) {
                    oData[aData[i].STATUS_KEY] = aData[i].TOTAL_REPORTS;
                }
                mStatuses.setData(oData);
            });
    
            var mColumnProperties = new sap.ui.model.json.JSONModel({
                general: {
                    layout: { padding: 0 }
                },
                tooltip: { visible: false },
                interaction: {
                    selectability: { mode: "SINGLE" }
                },
                legend: { visible: false },
                title: { visible: false },
                plotArea: {
                    background: {
                        visible: false,
                        border: { strokeWidth: 0 }
                    },
                    dataPoint: {
                        stroke: { visible: false }
                    },
                    dataLabel: {
                        visible: true,
                        style: {
                            fontSize: "1rem"
                        },
                        renderer: function(obj) {
                            if (obj.ctx.Status === "1") {
                                obj.styles.fill = "#427CAC";
                            } else if (obj.ctx.Status === "2") {
                                obj.styles.fill = "#F8A70E";
                            } else if (obj.ctx.Status === "3") {
                                obj.styles.fill = "#008A11";
                            }
                        }
                    },
                    gridline: { visible: false },
                    gap: { barSpacing: "0.5rem" },
                    markerRenderer: function(obj) {
                        if (obj.ctx.Status === "1") {
                            obj.graphic.fill = "#427CAC";
                        } else if (obj.ctx.Status === "2") {
                            obj.graphic.fill = "#F8A70E";
                        } else if (obj.ctx.Status === "3") {
                            obj.graphic.fill = "#008A11";
                        }
                    }
                },
                categoryAxis: {
                    title: { visible: false },
                    label: {
                        style: { color: "#FFFFFF" }
                    },
                    axisTick: { visible: false }
                },
                valueAxis: {
                    title: { visible: false },
                    label: { visible: false },
                    axisTick: { visible: false }
                }
            });
            this.getView().setModel(mColumnProperties, "columnChartProperties");
        },
        
        getFilterItems: function() {
            return [
                { key: "ID_LOCAL", label: "{i18n>ListItem.incidentID}" },
                { key: "STATUS", label: "{i18n>ListItem.status}", type: Filter.InputType.MultiSelect,
                  items: { path: "statuses>/", key: "{statuses>key}", text: "{statuses>text}" } },
                { key: "TITLE", label: "{i18n>ListItem.incidentTitle}" },
                { key: "PLANT_LOC_CODE", label: "{i18n>ListItem.location}" },
                { key: "START_DATE", label: "{i18n>ListItem.creationDate}", type: Filter.InputType.DateRange }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));