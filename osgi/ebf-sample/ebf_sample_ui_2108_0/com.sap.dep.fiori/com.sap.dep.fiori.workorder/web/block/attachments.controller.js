jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.workorder.block.attachments", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setBlockId("attachments");
            
            this.mAttachments = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttachments, "attachments");

            this.mUpload = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mUpload, "upload");
        },

        loadData: function(sAUFNR) {
            this.loadAttachments(sAUFNR);
        },

        refresh: function(oEvent) {
            this.mAttachments.setData([]);
            Utilities.showBusyIndicator(this.loadAttachments(this.getKeyValue()));
        },

        loadAttachments: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/attachment?OBJID=" + sAUFNR;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mAttachments.setData(aResponseData);
            }));
        },

        onDownload: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("attachments");
            var oAttachment = oContext.getModel().getProperty(oContext.getPath());
            Utilities.downloadAttachment(oAttachment);
        },

        onAddAttachment: function(oEvent) {
            var oUploader = this.getView().byId("upload");
            if (oUploader.getValue()) {
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "FILENAME",
                    value: this.mUpload.getProperty("/filepath")
                }));
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "OBJID",
                    value: this.getKeyValue()
                }));
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "ITEMCODE",
                    value: "BUS2007"
                }));

                this.oUploadPromise = Utilities.showBusyIndicator($.Deferred());
                oUploader.upload();
            }
        },

        onUploadComplete: function(oEvent) {
            this.oUploadPromise.resolve();

            if (oEvent.getParameter("status") === 200 &&
                oEvent.getParameter("responseRaw") === "[]") {

                // reset the FileUploader control for subsequent uploads
                oEvent.getSource().setValue("");
                oEvent.getSource().destroyHeaderParameters();

                this.loadAttachments(this.getKeyValue());
            } else {

            }
        },
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities));