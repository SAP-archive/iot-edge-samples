jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.servicecall.app.list", {
        onInit: function() {
            this.setKey("ID_LOCAL");
            this.setSortFragment("dep.fiori.servicecall.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            this.getServiceCallList();
        },
        
        getServiceCallList: function() {
            var self = this;
            $.ajax("/ws_restful_fsm_controller/service_call").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData));
            });
        },
        getFilterItems: function() {
            return [
                { key: "SUBJECT", label: "{i18n>ServiceCall.subject}" },
                { key: "PRIORITY", label: "{i18n>ServiceCall.priority}" },
                { key: "PROBLEM_TYPE_NAME", label: "{i18n>ServiceCall.problemType}" },
                { key: "ORIGIN_NAME", label: "{i18n>ServiceCall.origin}" },
                { key: "STATUS_NAME", label: "{i18n>ServiceCall.status}" },
                { key: "REMARKS", label: "{i18n>ServiceCall.remarks}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase,dep.fiori.lib.util.Filter));