jQuery.sap.setObject("dep.fiori.lib.util.MessageViewDialog", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(MessageViewDialog, Utilities) {
    var _oDialog = null;
    var _oDeferred = null;
    
    Object.assign(MessageViewDialog, {
        getDialog: function() {
            if (!_oDialog) {
                _oDialog = sap.ui.xmlfragment("dep.fiori.lib.frag.messageViewDialog", this);
                _oDialog.setModel(Utilities.geti18nGlobalModel(), "i18nGlobal");
                _oDialog.setModel(new sap.ui.model.json.JSONModel(), "messages");
            }
            return _oDialog;
        },

        showMessages: function(sTitle, aMessages) {
            var oDialog = this.getDialog();
            oDialog.setTitle(sTitle);
            oDialog.getModel("messages").setData(aMessages);
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
            
            _oDeferred = $.Deferred();
            return _oDeferred.promise();
        },

        close: function(oEvent) {
            _oDialog.getModel("messages").setData([]);
            _oDialog.close();
            _oDeferred.resolve();
        }
    });
}(dep.fiori.lib.util.MessageViewDialog, dep.fiori.lib.util.Utilities));