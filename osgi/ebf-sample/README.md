# SAP Edge Services - Essential Business Functions sample UI
## Description
A sample user interface for the Essential Business Functions edge database. This README document provides instructions on applying the UI to an existing edge deployment.
## Deploying this sample
### Download
Download the appropriate version of the sample user interface for the edge deployment. Versions must match, for example, if you use a newer version of the user interface without upgrading the database, the user interface may try to access unimplemented web services.
### Unzip
On the edge machine, unzip the files to the `reports` folder of your edge deployment.
- For SAP Edge Services Cloud Edition, this can be found in the `edgeservices/businessessentials` folder adjacent to the edge gateway directory
- For SAP Edge Services On-premise Edition, the default directory is `C:\SAP\DEP` on Windows and `/home/SAP/DEP` on Linux
The final folder structure should look like this, using the 2108.0 version as an example (`ebf_sample_ui_2108_0`):
<pre>
. (edge deployment folder)
├── db
├── reports
│   ├── ATTS_BUS2007
│   ├── ATTS_BUS2012
│   ├── ATTS_BUS2019
│   ├── ATTS_BUS2091
│   ├── scanner
│   ├── uploads
│   ├── <b>ebf_sample_ui_2108_0</b>
│   │   ├── com.sap.dep.fiori
│   │   │   └── ...
│   │   └── ebf_sample_ui_2108_0.sql
│   └── file transfer.log
└── ...
</pre>
### Connect to the Edge Database
#### SAP Edge Services, On-premise Edition
If the edge machine is running Linux, first set up the SQL Anywhere environment:
`source /opt/sqlanywhere/bin64/sa_config.sh`
Execute the following command, substituting your edge database's connection information for the placeholders:
`dbisql -nogui -c "server=DEP_rem_<plant number>;uid=<uid>;pwd=<pwd>;"`
#### SAP Edge Services, Cloud Edition
Locate the `cfg` folder in the `edgeservices/businessessentials` directory mentioned above.
Execute the following command, substituting your edge database's `cfg` folder path for the placeholder:
`dbisql -nogui @<cfg_dir>/dbconnect.cfg`
### Apply the Sample UI to the Edge Database
Execute the .sql file included with the sample UI download, substituting your edge database's root directory for the placeholder.
`READ <edge_deployment_folder>/reports/ebf_sample_ui_2108_0/ebf_sample_ui_2108_0.sql;`