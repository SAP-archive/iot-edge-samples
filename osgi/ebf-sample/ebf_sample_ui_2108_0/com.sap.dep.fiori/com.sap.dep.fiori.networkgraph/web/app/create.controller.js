
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/ListBase",
	"sap/m/StandardListItem",
	"sap/m/Select",
	"sap/ui/core/Item",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/suite/ui/commons/networkgraph/layout/SwimLaneChainLayout",
	"sap/suite/ui/commons/networkgraph/ActionButton",
	"sap/suite/ui/commons/networkgraph/Node"
], function (Controller, JSONModel, Popover, ListBase, StandardListItem, Select, Item, Filter, FilterOperator, SwimLaneChainLayout, ActionButton, Node) {

	var oPageController = Controller.extend("dep.fiori.networkgraph.app.create", {
		onInit: function () {
			var oGraph;
			var self = this;

			this.soList = new JSONModel();		
			//this.getView().setModel(this.soList, "oModel");			
			
			this.equipmentDropdown = new JSONModel();
			this.getView().setModel(this.equipmentDropdown, "equipmentDropdown");
			     
			$.ajax("/ws_restful_salesorder_data_controller/network_graph").done(function(aResponseData) {
				aResponseData = aResponseData || [];
				self.soList.setData(aResponseData);
			});				
				
            this.getView().setModel(this.soList);		
			this.setUpOrientationSelect();		
			
			
			this.getView().attachAfterRendering(function() {
				self.filterEquipmentOnly();				
                self.addToEquipmentItems();				
			});
			
			
			oGraph = this.byId("graph");
			oGraph.setLayoutAlgorithm(new SwimLaneChainLayout());
			
            //add custom detail button and attribute labels
				oGraph.attachEvent("beforeLayouting", function (oEvent) {
				oGraph.preventInvalidation(true);
				oGraph.getNodes().forEach(function (oNode) {
					var oDetailButton; 
					var custGroup = oNode.getGroup() == '4';
					var soGroup = oNode.getGroup() == '3';
					var poGroup = oNode.getGroup() == '2';
					var equipGroup = oNode.getGroup() == '1';
                    var i18n = this.getView().getModel("i18n");					
					oNode.removeAllActionButtons();	
					oNode.setShowDetailButton(false);	
					oDetailButton = new ActionButton({
						title: "Detail",
						icon: "sap-icon://menu",
						press: function (oEvent) {							
							if(equipGroup) {
							this._openEquipmentDetails(oNode, oEvent.getParameter("buttonElement"));
							}
							if(poGroup) {
							this._openProductionOrderDetails(oNode, oEvent.getParameter("buttonElement"));
							}
							if(soGroup) {
							this._openSalesOrderDetails(oNode, oEvent.getParameter("buttonElement"));
							}
							if(custGroup) {
							this._openCustomerDetails(oNode, oEvent.getParameter("buttonElement"));
							}
							
						}.bind(this)
					});
					oNode.addActionButton(oDetailButton);
					if(custGroup) {
						oNode.getAttributes()[0].setLabel(i18n.getProperty("customer.Name"));
						oNode.getAttributes()[1].setLabel(i18n.getProperty("customer.Priority"));	
                    }
                    if(soGroup) {
						oNode.getAttributes()[0].setLabel(i18n.getProperty("salesOrder.DeliveryDate"));
						oNode.getAttributes()[1].setLabel(i18n.getProperty("salesOrder.Price"));	
                    }
					if(poGroup) {
						oNode.getAttributes()[0].setLabel(i18n.getProperty("productionOrder.DueDate"));
						oNode.getAttributes()[1].setLabel(i18n.getProperty("productionOrder.OperationNumber"));	
						oNode.getAttributes()[2].setLabel(i18n.getProperty("productionOrder.OperationText"));
						oNode.getAttributes()[3].setLabel(i18n.getProperty("productionOrder.Number"));
                        oNode.getAttributes()[4].setLabel(i18n.getProperty("productionOrder.Quantity"));
                    }
					if(equipGroup) {
						oNode.getAttributes()[0].setLabel(i18n.getProperty("equipment.Description"));
                    }	
				}, this);
				oGraph.preventInvalidation(false);
			}.bind(this));
			
		
					
		},	
        addToEquipmentItems: function() {
			self = this;
			setTimeout(function(){ 
			    var getEquipmentList = self.getView().byId("equipmentList");		
				getEquipmentList.insertItem(new sap.ui.core.ListItem({text: 'All', key: 'All'}), 0);
				var getAllEquipment = self.getView().byId("equipmentList").getItems()[0];
				self.getView().byId("equipmentList").setSelectedItem(getAllEquipment);
            }, 2000);  			
		},		
        filterEquipmentOnly: function() {
			var sValue1 = "1";
			var sPath = "group";
			var sOperator = "EQ";
			var oBinding = this.byId("equipmentList").getBinding("items");
			oBinding.filter([new Filter(sPath, sOperator, sValue1)]);					
		},		
		setUpOrientationSelect: function () {
			var oGraph = this.byId("graph"),
				oToolbar = this.byId("graph-toolbar"),
				oOrientation = new Select();

			[
				{key: "LeftRight", text: "Left to right"},
				{key: "RightLeft", text: "Right to left"},
				{key: "TopBottom", text: "Top to bottom"},
				{key: "BottomTop", text: "Bottom to top"}
			].forEach(function (o) {
				oOrientation.addItem(new Item(o));
			});
			oOrientation.setSelectedKey("LeftRight");
			oOrientation.attachChange(function (oEvent) {
				var sKey = oEvent.getParameter("selectedItem").getKey();
				oGraph.setOrientation(sKey);
			});
			oToolbar.insertContent(oOrientation, 0);
		},
		_getCustomDataValue: function (oNode, sName) {
			var aItems = oNode.getCustomData().filter(function (oData) {
				return oData.getKey() === sName;
			});

			return aItems.length > 0 && aItems[0].getValue();
		},
		_openCustomerDetails: function (oNode, oButton) {
			if (!this._oCustomerPopoverView) {
				this._oCustomerPopoverView = sap.ui.xmlfragment('_oCustomerPopoverViewID', "dep.fiori.networkgraph.app.customerFragment", this);
				/* doesn't work
				var i18nModel = new sap.ui.model.resource.ResourceModel({
                            bundleUrl : "i18n/i18n.properties"
                        });
				this._oCustomerPopoverView.setModel(i18nModel, "i18n");  
				*/
				//this works for i18n
				this.getView().addDependent(this._oCustomerPopoverView);			
			}
			this._oCustomerPopoverView.setModel(new JSONModel({
				title: this._getCustomDataValue(oNode, "title"),
				Name: this._getCustomDataValue(oNode, "Name"),
				Priority: this._getCustomDataValue(oNode, "Priority"),
				Str: this._getCustomDataValue(oNode, "Str"),
				City: this._getCustomDataValue(oNode, "City"),
				State: this._getCustomDataValue(oNode, "State"),
				ZIP: this._getCustomDataValue(oNode, "ZIP"),
				Country: this._getCustomDataValue(oNode, "Country"),
				Phone: this._getCustomDataValue(oNode, "Phone"),
				Fax: this._getCustomDataValue(oNode, "Fax")
			}));
			jQuery.sap.delayedCall(0, this, function () {				
				this._oCustomerPopoverView.openBy(oButton);
			});			
		},
		_openSalesOrderDetails: function (oNode, oButton) {
			if (!this._oSalesOrderPopoverView) {
				this._oSalesOrderPopoverView = sap.ui.xmlfragment('_oSalesOrderPopoverViewID', "dep.fiori.networkgraph.app.salesOrderFragment", this);
				this.getView().addDependent(this._oSalesOrderPopoverView);			
			}
			this._oSalesOrderPopoverView.setModel(new JSONModel({
				title: this._getCustomDataValue(oNode, "title"),
				DeliveryDate: this._getCustomDataValue(oNode, "DeliveryDate"),
				Price: this._getCustomDataValue(oNode, "Price"),
				SalesItem: this._getCustomDataValue(oNode, "SalesItem"),
				SalesOrg: this._getCustomDataValue(oNode, "SalesOrg"),
				SalesOrgName: this._getCustomDataValue(oNode, "SalesOrgName")
			}));
			jQuery.sap.delayedCall(0, this, function () {				
				this._oSalesOrderPopoverView.openBy(oButton);
			});			
		},
		_openProductionOrderDetails: function (oNode, oButton) {
			if (!this._oProductionOrderPopoverView) {
				this._oProductionOrderPopoverView = sap.ui.xmlfragment('_oProductionOrderPopoverViewID', "dep.fiori.networkgraph.app.productionOrderFragment", this);
				this.getView().addDependent(this._oProductionOrderPopoverView);			
			}
			this._oProductionOrderPopoverView.setModel(new JSONModel({
				title: this._getCustomDataValue(oNode, "title"),
				Quantity: this._getCustomDataValue(oNode, "Quantity"),
				DueDate: this._getCustomDataValue(oNode, "DueDate"),
				OperationNumber: this._getCustomDataValue(oNode, "OperationNumber"),
				OperationText: this._getCustomDataValue(oNode, "OperationText"),
				OperationStatus: this._getCustomDataValue(oNode, "OperationStatus"),
				OrderStatus: this._getCustomDataValue(oNode, "OrderStatus")
			}));
			jQuery.sap.delayedCall(0, this, function () {				
				this._oProductionOrderPopoverView.openBy(oButton);
			});			
		},
		_openEquipmentDetails: function (oNode, oButton) {
			if (!this._oEquipmentPopoverView) {
				this._oEquipmentPopoverView = sap.ui.xmlfragment('_oEquipmentPopoverViewID', "dep.fiori.networkgraph.app.equipmentFragment", this);
				this.getView().addDependent(this._oEquipmentPopoverView);			
			}
			this._oEquipmentPopoverView.setModel(new JSONModel({
				title: this._getCustomDataValue(oNode, "title"),
				Description: this._getCustomDataValue(oNode, "Description"),

				CostCenter: this._getCustomDataValue(oNode, "CostCenter")
			}));
			jQuery.sap.delayedCall(0, this, function () {				
				this._oEquipmentPopoverView.openBy(oButton);
			});			
		},
		closePopover: function() {	
            if (this._oCustomerPopoverView) {		
				this._oCustomerPopoverView.close();
			}
			if (this._oSalesOrderPopoverView) {		
				this._oSalesOrderPopoverView.close();
			}
			if (this._oProductionOrderPopoverView) {		
				this._oProductionOrderPopoverView.close();
			}
			if (this._oEquipmentPopoverView) {		
				this._oEquipmentPopoverView.close();
			}
		},
		onExit: function() {
			if (this._oCustomerPopoverView) {
				//oNode.setShowDetailButton(false);
                this._oCustomerPopoverView.destroy();				
			}
			if (this._oSalesOrderPopoverView) {
				this._oSalesOrderPopoverView.destroy();	
			}
			if (this._oProductionOrderPopoverView) {
				this._oProductionOrderPopoverView.destroy();
			}
			if (this._oEquipmentPopoverView) {
			    this._oEquipmentPopoverView.destroy();
			}			
		},
		onSelectEquipment: function (oEvent) {
			var self = this;  
			var selectedEquipment = oEvent.getSource().getSelectedItem().getText();		
			var selectedIndex = self.getView().byId("equipmentList").getSelectedIndex();
					
			$.ajax({
				url: '/ws_restful_salesorder_data_controller/network_graph',
				headers: { 'EQUNR': selectedEquipment },
				success: function(aResponseData) {
					aResponseData = aResponseData || [];
					self.soList.setData(aResponseData);
				}
			});
			
			self.getView().setModel(self.soList, "selectedEquipment");
			
			//this.setUpOrientationSelect();
			var oGraph;
			oGraph = self.byId("graph");
			oGraph.setLayoutAlgorithm(new SwimLaneChainLayout());
			
			
            if (selectedEquipment) {
				$.ajax({
				url: '/ws_restful_salesorder_data_controller/network_graph',
				headers: { 'EQUNR': '' },
				success: function(aResponseData) {
					aResponseData = aResponseData || [];
					self.equipmentDropdown.setData(aResponseData);
					}
				});

				self.getView().byId("equipmentList").setModel(self.equipmentDropdown);	
				self.filterEquipmentOnly();
				
				setTimeout(function(){ 
					var getEquipmentList = self.getView().byId("equipmentList");
					getEquipmentList.insertItem(new sap.ui.core.ListItem({text: 'All', key: 'All'}), 0); 				
                    if(selectedEquipment == "All")	{
						var getAllEquipment =  self.getView().byId("equipmentList").getItems()[0];
						self.getView().byId("equipmentList").setSelectedItem(getAllEquipment);
						$.ajax({
							url: '/ws_restful_salesorder_data_controller/network_graph',
							headers: { 'EQUNR': '' },
							success: function(aResponseData) {
								aResponseData = aResponseData || [];
								self.soList.setData(aResponseData);
							}
						});
						self.getView().setModel(self.soList, "selectedEquipment");
						oGraph.setLayoutAlgorithm(new SwimLaneChainLayout());					
					}
                    else {
						var getOtherEquipment =  self.getView().byId("equipmentList").getItems()[selectedIndex];
						self.getView().byId("equipmentList").setSelectedItem(getOtherEquipment);
					}					
				}, 2000);
			}					
										
		}
	});
     
	return oPageController;
});
