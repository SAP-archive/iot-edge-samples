jQuery.sap.declare("dep.fiori.lib.control.IntegrationForm");
jQuery.sap.require("sap.ui.layout.form.Form");

(function(Form) {
    var _sCurrentIntegrationPoint;

    Form.extend("dep.fiori.lib.control.IntegrationForm", {
        metadata: {
            properties: {
                urlPrefix: {
                    defaultValue: ""
                },
                integrationPoint: {
                    defaultValue: ""
                }
            }
        },

        init: function() {
            this.setModel(new sap.ui.model.json.JSONModel(), "Integration.metadata");
            this.setModel(new sap.ui.model.json.JSONModel());

            this.setLayout(new sap.ui.layout.form.ResponsiveGridLayout({
                hSpacing: 2
            }));

            this.setToolbar(new sap.m.Toolbar({
                content: [
                    new sap.m.Title({
                        text: "{Integration.metadata>/DESCRIPTION}"
                    }),
                    new sap.m.ToolbarSpacer()
                ]
            }));
        },

        renderer: function(oRm, oControl) {
            // A model has been updated, check if we need to do anything special
            var sIntegrationPoint = oControl.getIntegrationPoint();
            if (sIntegrationPoint && sIntegrationPoint !== _sCurrentIntegrationPoint) {
                _sCurrentIntegrationPoint = sIntegrationPoint;
                oControl.getModel("Integration.metadata").setData({});

                var sURL = oControl.getUrlPrefix() + "/ws_restful_data_controller/integration_points?INTEGRATION_POINT=" + sIntegrationPoint;
                $.ajax(sURL).done(function(oResponseData) {
                    oControl.buildForm.call(oControl, oResponseData);
                }).fail(function() {

                });
            }

            // The default Form renderer will handle rendering the controls
            Form.prototype.getRenderer().render.call(this, oRm, oControl);
        },

        buildForm: function(oMetadata) {
            var oRequestTemplate = {};
            var oHeaders = {};
            var oLookups = {};
            var aControls = [];

            this.destroyFormContainers();

            for (var i = 0; i < oMetadata.PROPERTIES.length; i++) {
                var oProperty = oMetadata.PROPERTIES[i];
                if (oProperty.PROPERTY_TYPE === "LOOKUP") {
                    // Group properties that share the same lookup
                    oLookups[oProperty.LOOKUP_ID] = oLookups[oProperty.LOOKUP_ID] || [];
                    oLookups[oProperty.LOOKUP_ID].push(oProperty);
                } else if (oProperty.PROPERTY_TYPE === "DROPDOWN") {
                    // Make the label and dropdown
                    var oSelect = new sap.m.Select({
                        selectedKey: "{/" + oProperty.PROPERTY + "}",
                        showSecondaryValues: true
                    });

                    var oOptions = JSON.parse(oProperty.VALUE_OPTIONS);
                    for (var sKey in oOptions) {
                        oSelect.addItem(new sap.ui.core.ListItem({
                            text: oOptions[sKey],
                            key: sKey,
                            additionalText: sKey
                        }));
                    }

                    aControls.push(
                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                text: oProperty.LABEL,
                                tooltip: oProperty.LABEL
                            }),
                            fields: [ oSelect ]
                        })
                    );
                } else if (oProperty.PROPERTY_TYPE.startsWith("DATE")) {
                    // Type is DATE(format), so extract the format code
                    var sFormat = oProperty.PROPERTY_TYPE.match(/\((.*?)\)/);
                    if (sFormat && Array.isArray(sFormat)) {
                        sFormat = sFormat[1];
                    } else { // default format if type is just DATE
                        sFormat = "yyyyMMdd";
                    }

                    // Make the label and date box
                    aControls.push(
                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                text: oProperty.LABEL,
                                tooltip: oProperty.LABEL
                            }),
                            fields: [
                                new sap.m.DatePicker({
                                    valueFormat: sFormat,
                                    value: "{/" + oProperty.PROPERTY + "}"
                                })
                            ]
                        })
                    );
                } else if (oProperty.PROPERTY_TYPE.startsWith("TIME")) {
                    // Type is TIME(format), so extract the format code
                    var sFormat = oProperty.PROPERTY_TYPE.match(/\((.*?)\)/)[1];
                    if (sFormat && Array.isArray(sFormat)) {
                        sFormat = sFormat[1];
                    } else { // default format if type is just TIME
                        sFormat = "HHmmss";
                    }

                    // Make the label and time picker
                    aControls.push(
                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                text: oProperty.LABEL,
                                tooltip: oProperty.LABEL
                            }),
                            fields: [
                                new sap.m.TimePicker({
                                    valueFormat: sFormat,
                                    value: "{/" + oProperty.PROPERTY + "}"
                                })
                            ]
                        })
                    );
                } else if (oProperty.PROPERTY_TYPE.startsWith("TEXT")) {
                    // Type is TEXT(maxLength), so extract the max length
                    var sMaxLength = oProperty.PROPERTY_TYPE.match(/\((.*?)\)/)[1];
                    if (sMaxLength && Array.isArray(sMaxLength)) {
                        sMaxLength = sMaxLength[1];
                    } else { // default to no max if type is just TEXT
                        sMaxLength = 0;
                    }

                    // Make the label and text box
                    // Make the label and text box
                    aControls.push(
                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                text: oProperty.LABEL,
                                tooltip: oProperty.LABEL
                            }),
                            fields: [
                                new sap.m.Input({
                                    value: "{/" + oProperty.PROPERTY + "}",
                                    maxLength: sMaxLength
                                })
                            ]
                        })
                    );
                }

                // Set defaults
                if (oProperty.PROPERTY_TYPE === "HEADER") {
                    oHeaders[oProperty.PROPERTY] = oProperty.DEFAULT_VALUE;
                } else {
                    oRequestTemplate[oProperty.PROPERTY] = oProperty.DEFAULT_VALUE;
                }
            }

            // Declare variables for the loop rather than redeclaring them each iteration
            var aLookupControls = [];
            var aProperties;
            var oLookup;
            var oPrimaryColumn;
            var oProperty;
            var self = this;
            for (var sKey in oLookups) {
                aProperties = oLookups[sKey];
                // Get the lookup metadata based on the ID
                oLookup = null;
                for (var i = 0; i < oMetadata.LOOKUPS.length; i++) {
                    if (oMetadata.LOOKUPS[i].LOOKUP_ID === sKey) {
                        oLookup = oMetadata.LOOKUPS[i];
                        break;
                    }
                }
                if (!oLookup) {
                    // No matching lookup, missing configuration data?
                    continue;
                }
                // Figure out how to label the input on the form
                oPrimaryColumn = null;
                for (var n = 0; n < oLookup.PROPERTIES.length; n++) {
                    if (!oPrimaryColumn || oLookup.PROPERTIES[n].SORTING < oPrimaryColumn.SORTING) {
                        oPrimaryColumn = oLookup.PROPERTIES[n];
                    }
                }
                // Find the corresponding property for the request template
                // Property names may differ between the request template and lookup, so we use this one
                oProperty = null;
                for (var x = 0; x < aProperties.length; x++) {
                    if (aProperties[x].VALUE_OPTIONS === oPrimaryColumn.PROPERTY) {
                        oProperty = aProperties[x];
                    }
                }

                // Use closure to effectively pass by value instead of by reference
                (function(oLookup, aProperties, oProperty) {
                    // Make the actual control
                    aLookupControls.push(new sap.ui.layout.form.FormElement({
                        label: new sap.m.Label({
                            text: oProperty.LABEL,
                            tooltip: oProperty.LABEL
                        }),
                        fields: [
                            new sap.m.Input({
                                value: "{/" + oProperty.PROPERTY + "}",
                                showValueHelp: true,
                                valueHelpOnly: true,
                                valueHelpRequest: function() {
                                    self.openLookupDialog(oLookup, aProperties);
                                }
                            })
                        ]
                    }));
                })(oLookup, aProperties, oProperty);
            }

            // Add the controls to the form
            this.addFormContainer(new sap.ui.layout.form.FormContainer({
                formElements: aLookupControls.concat(aControls)
            }));

            // Override defaults with configured ones if applicable
            if (oMetadata.CONFIGURED_DEFAULTS_URL) {
                var sURL = this.getUrlPrefix() + oMetadata.CONFIGURED_DEFAULTS_URL;
                var self = this;
                $.ajax({
                    url: sURL,
                    method: oMetadata.CONFIGURED_DEFAULTS_METHOD
                }).done(function(oResponseData) {
                    // Apply configured defaults and set the models
                    oRequestTemplate = Object.assign(oRequestTemplate, oResponseData);
                    self.getModel("Integration.metadata").setData(oMetadata);
                    self.getModel().setData(oRequestTemplate);
                }).fail(function() {

                });
            } else {
                // No URL for configured defaults, so just set the models
                this.getModel("Integration.metadata").setData(oMetadata);
                this.getModel().setData(oRequestTemplate);
            }
        },

        getLookupDialog: function() {
            if (!this.oLookupDialog) {
                // One-time initialization of a reusable dialog
                var self = this;
                this.oLookupDialog = new sap.m.TableSelectDialog({
                    confirm: function(oEvent) {
                        if (self.onLookupConfirm) {
                            self.onLookupConfirm.call(self, oEvent);
                        }
                    },
                    search: function(oEvent) {
                        if (self.onLookupSearch) {
                            self.onLookupSearch.call(self, oEvent);
                        }
                    }
                });
                this.oLookupDialog.setModel(new sap.ui.model.json.JSONModel(), "Integration.lookup");
            }

            return this.oLookupDialog;
        },

        openLookupDialog: function(oLookup, aProperties) {
            // Reuse the same control
            var oDialog = this.getLookupDialog();

            // Do some cleanup
            oDialog.getModel("Integration.lookup").setData([]);
            oDialog.unbindItems();
            oDialog.destroyItems();
            oDialog.destroyColumns();

            oDialog.setTitle(oLookup.DESCRIPTION);

            // Get a sorted list of columns
            var aColumns = oLookup.PROPERTIES.sort(function(a, b) {
                return a.SORTING - b.SORTING;
            });

            var aCells = [];
            for (var i = 0; i < aColumns.length; i++) {
                // Add each column
                oDialog.addColumn(new sap.m.Column({
                    vAlign: sap.ui.core.VerticalAlign.Middle,
                    header: new sap.m.Title({
                        text: aColumns[i].LABEL,
                        tooltip: aColumns[i].LABEL
                    })
                }));

                // Add the content for the corresponding column
                aCells.push(new sap.m.Label({
                    text: "{Integration.lookup>" + aColumns[i].PROPERTY + "}"
                }));
            }

            // Bind the model to the list of cells
            oDialog.bindItems({
                path: "Integration.lookup>/",
                template: new sap.m.ColumnListItem({
                    type: sap.m.ListType.Active,
                    cells: aCells
                })
            });

            // Set up the confirm handler
            var mRequestTeplate = this.getModel();
            this.onLookupConfirm = function(oEvent) {
                var oListItem = oEvent.getParameter("selectedItem");
                var oContext = oListItem.getBindingContext("Integration.lookup");
                var oObject = oContext.getModel().getProperty(oContext.getPath());
                // Apply selected object's properties to the main model
                if (oObject) {
                    for (var i = 0; i < aProperties.length; i++) {
                        mRequestTeplate.setProperty("/" + aProperties[i].PROPERTY, oObject[aProperties[i].VALUE_OPTIONS]);
                    }
                }
            };

            this.onLookupSearch = function(oEvent) {
                var sQuery = oEvent.getParameter("value");
                var oBinding = oEvent.getParameter("itemsBinding");

                var aFilters = [];
                for (var i = 0; i < oLookup.PROPERTIES.length; i++) {
                    aFilters.push(new sap.ui.model.Filter(
                        oLookup.PROPERTIES[i].PROPERTY,
                        sap.ui.model.FilterOperator.Contains,
                        sQuery
                    ));
                }

                oBinding.filter(new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                }));
            };

            // Actually perform the lookup
            var sURL = this.getUrlPrefix() + oLookup.LOOKUP_URL;
            $.ajax({
                url: sURL,
                method: oLookup.LOOKUP_METHOD
            }).done(function(aResponseData) {
                oDialog.getModel("Integration.lookup").setData(aResponseData);
                oDialog.open();
            }).fail(function() {

            });
        },

        getTemplate: function() {
            var oMetadata = this.getModel("Integration.metadata").getData();
            var oHeaders = {};
            for (var i = 0; i < oMetadata.PROPERTIES.length; i++) {
                if (oMetadata.PROPERTIES[i].PROPERTY_TYPE === "HEADER") {
                    oHeaders[oMetadata.PROPERTIES[i].PROPERTY] = oMetadata.PROPERTIES[i].DEFAULT_VALUE;
                }
            }
            return {
                INTEGRATION_POINT_ID: oMetadata.ID,
                SUBMIT_URL: oMetadata.SUBMIT_URL,
                SUBMIT_METHOD: oMetadata.SUBMIT_METHOD,
                REQUEST_BODY: this.getModel().getData(),
                REQUEST_HEADERS: oHeaders
            };
        }
    });
}(sap.ui.layout.form.Form));