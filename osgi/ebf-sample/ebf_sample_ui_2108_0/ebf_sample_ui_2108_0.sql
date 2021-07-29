BEGIN
	DECLARE lv_local_dir LONG NVARCHAR = DBA.sp_sync_get_local_file_directory();
	DECLARE lv_ui_dir LONG NVARCHAR = '/ebf_sample_ui_2108_0/com.sap.dep.fiori';
	DECLARE lv_current_ver VARCHAR( 2000 ) = DBA.sp_sync_option_get_current_core_edge_version();
	DECLARE lv_new_ver VARCHAR( 2000 ) = '03.04.21080';
	
	CALL SAAP.sp_saap_populate_webpage_table( lv_local_dir || lv_ui_dir, 'SAAP.webpages_fiori_apps' );
	CALL DBA.sp_sync_option_current_core_edge_version( lv_new_ver );
	
	COMMIT;
END;