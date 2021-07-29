jQuery.sap.declare("dep.fiori.lib.control.IntegrationControl");
jQuery.sap.require("dep.fiori.lib.control.IntegrationForm");
jQuery.sap.require("sap.m.VBox");

(function(VBox, IntegrationForm) {
    var _sCurrentIntegrationPoint;

    VBox.extend("dep.fiori.lib.control.IntegrationControl", {
        metadata: {
            properties: {
                urlPrefix: {
                    defaultValue: ""
                },
                label: {
                    defaultValue: ""
                }
            }
        },

        init: function() {
            this.setModel(new sap.ui.model.json.JSONModel({
                urlPrefix: "",
                label: "",
                selected: null
            }), "Integration.parent");
            this.setModel(new sap.ui.model.json.JSONModel(), "Integration.type");

            this.addItem(new sap.m.Label({
                text: "{Integration.parent>/label}"
            }));

            var oSelect = new sap.m.Select({
                forceSelection: false,
                showSecondaryValues: true,
                change: [ this.onSelect, this ]
            });
            oSelect.bindAggregation("items", {
                path: "Integration.type>/",
                template: new sap.ui.core.ListItem({
                    key: "{Integration.type>ID}",
                    text: "{Integration.type>DESCRIPTION}"
                })
            });
            this.addItem(oSelect);

            this.oForm = new IntegrationForm({
                integrationPoint: "{Integration.parent>/selected}",
                urlPrefix: "{Integration.parent>/urlPrefix}"
            });
            this.addItem(this.oForm);
            this.setModel(this.oForm.getModel());

            VBox.prototype.init.apply(this, arguments);
        },

        renderer: function(oRm, oControl) {
            // If the url prefix is changed, refetch the list of integration points
            var mUrlPrefix = oControl.getModel("Integration.parent");
            if (oControl.getUrlPrefix() !== mUrlPrefix.getProperty("/urlPrefix")) {
                oControl.getModel("Integration.type").setData([]);
                mUrlPrefix.setProperty("/urlPrefix", oControl.getUrlPrefix())

                $.ajax(mUrlPrefix.getProperty("/urlPrefix") + "/ws_restful_data_controller/integration_points").done(function(aResponseData) {
                    oControl.getModel("Integration.type").setData(aResponseData);
                }).fail(function() {

                });
            }

            oControl.getModel("Integration.parent").setProperty("/label", oControl.getLabel());

            VBox.prototype.getRenderer().render.call(this, oRm, oControl);
        },

        onSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("selectedItem");
            this.getModel("Integration.parent").setProperty("/selected", oListItem.getKey());
        },

        getTemplate: function() {
            return this.oForm.getTemplate();
        }
    });
}(sap.m.VBox, dep.fiori.lib.control.IntegrationForm));