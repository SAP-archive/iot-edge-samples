jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.workorder.block.history", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setBlockId("history");
            
            this.mHistoryDetail = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mHistoryDetail, "historyDetail");

            this.mHistory = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mHistory, "history");
        },
        
        loadData: function(sAUFNR) {
            Utilities.showBusyIndicator(
                $.when(this.loadHistoryDetail(sAUFNR), this.loadHistory(sAUFNR))
            );
        },

        refreshDetail: function(oEvent) {
            Utilities.showBusyIndicator(this.loadHistoryDetail(this.getKeyValue()));
        },

        loadHistoryDetail: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder_history_details?AUFNR=" + sAUFNR;

            var self = this;
            return $.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mHistoryDetail.setData(oResponseData);
            });
        },

        refreshList: function(oEvent) {
            this.mHistory.setData([]);
            var sAUFNR = this.getKeyValue();
            Utilities.showBusyIndicator(this.loadHistory(sAUFNR));
        },

        loadHistory: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/equipment_workorder_history?AUFNR=" + sAUFNR;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                self.mHistory.setData(aResponseData);
            });
        },

        loadLTXT: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/equipment_workorder_history_notes?AUFNR=" + sAUFNR;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL));
        },

        appendNote: function(oEvent) {
            var sAUFNR = this.mHistoryDetail.getProperty("/AUFNR");
            var sAppend = this.mHistoryDetail.getProperty("/LTXT_ADD");
            this.mHistoryDetail.setProperty("/WO_OPNOTE_LTXT", sAppend);

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/workorder_history_details?AUFNR=" + sAUFNR,
                method: "PUT",
                data: this.mHistoryDetail.getJSON()
            })).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                }

                self.mHistoryDetail.setProperty("/LTXT_ADD", "");
                self.loadLTXT(sAUFNR).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }

                    self.mHistoryDetail.setProperty("/WO_HISTORY_NOTES", oResponseData.WO_HIST_EQUIP_LTXT);
                });
            });
        },

        onNotePress: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("history");
            var oHistoryItem = oContext.getModel().getProperty(oContext.getPath());

            var self = this;
            self.loadLTXT(oHistoryItem.AUFNR).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.show(oResponseData.WO_HIST_EQUIP_LTXT, {
                    title: self.getText("History.noteFor", [ oHistoryItem.AUFNR ]),
                    icon: sap.m.MessageBox.Icon.INFORMATION,
                    actions: [
                        sap.m.MessageBox.Action.OK
                    ]
                });
            });
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities));