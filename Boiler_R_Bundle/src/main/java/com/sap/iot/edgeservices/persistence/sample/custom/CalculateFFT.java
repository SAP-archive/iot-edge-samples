package com.sap.iot.edgeservices.persistence.sample.custom;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttSecurityException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.sap.iot.edgeservices.persistence.sample.BoilerPredictiveActivator;
import com.sap.iot.edgeservices.persistence.sample.Calculation;
import com.sap.iot.edgeservices.persistence.sample.ConfigurationProperty;
import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.persistence.sample.db.Table;
import com.sap.iot.edgeservices.persistenceservice.model.PSDataObject;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistence.sample.Route;
import org.restlet.Component;
import org.restlet.Server;
import org.restlet.data.Protocol;
import org.restlet.ext.jetty.HttpServerHelper;
import org.restlet.ext.jetty.JettyServerHelper;

public class CalculateFFT extends Calculation {

    ////////////////////
    // Static fields
    ////////////////////
    private static OS_ARCH OSArch = OS_ARCH.NONE;

    ////////////////////
    // Class fields
    ////////////////////
    private Properties configProperties = null;
    private ConfigurationProperty requiredSamples;
    private ConfigurationProperty calculationDelayMS;
    private ConfigurationProperty timeVariance;
    private File rDir = null;
    private File rBin = null;
    private File rScript = null;
    private File rInput = null;
    private File rFetchTime = null;
    private Component restletComponent;

    ////////////////////
    // constructors
    ////////////////////
    public CalculateFFT(PersistenceClient persistenceClient) {
        super(persistenceClient);

        BoilerPredictiveActivator.printlnDebug("CalculateFFT - called");

        OSArch = OSChecker.getOSArch();

        // properties that control how the Calculation will be done the user
        // can stream into IOTS the appropriate sensorTypeAlternateid,
        // capabilityAlternateId and value, and this sample will pick up those
        // values to change the way the transformation is done
        requiredSamples = new ConfigurationProperty( "requiredSamples", "7", "FFT1", "16" );
        // not implemented in sample
        // intended to test if sample came in at the appropriate time
        timeVariance = new ConfigurationProperty( "timeVariance", "7", "FFT3", "50" );
    }

  ////////////////////
  // public methods
  ////////////////////

    private String readOutputValuesFromFile() throws IOException {
        File outFile = new File(rDir, "out.txt");
        FileReader fr = new FileReader(outFile);
        BufferedReader br = new BufferedReader(fr);
        String line;
        String val = "";
        while((line = br.readLine()) != null){
            //process the line
            val = val.concat(line + "\n");
            System.out.println(line);
        }
        return val;
    }


    private void getPredictiveSampleDataToOutFile(File outFile, Integer temperature, Integer pressure) {

    Date date = new Date();
        try (Writer writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(outFile)))) {
            writer.write("Temperature, Pressure, ReadingTime\n");
            writer.write(  temperature + ", "  + pressure + ", " + date.toString() + "\n");
        }catch (FileNotFoundException fnfe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input file not found:" + fnfe.getMessage());
        } catch (IOException ioe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input io error:" + ioe.getMessage());
        }
    }

    public Integer calculatePredictiveValue(Integer temperature, Integer pressure) throws IOException {

        BoilerPredictiveActivator.printlnDebug("Boiler_R: Prediction calculation begins: temp" + temperature + " pressure " + pressure);
        getPredictiveSampleDataToOutFile(rInput, temperature, pressure);
        ProcessResults processResults;

        List<String> cmd = Arrays.asList(
            rBin.getAbsolutePath(),
            "--vanilla",
            rScript.getAbsolutePath(),
            rInput.getAbsolutePath()
        );

        BoilerPredictiveActivator.println("Cmd file executed");

        processResults = executeProcess(cmd, true, rDir);


        if (processResults.returnCode == 0) {
            return getOutputEfficiency(readOutputValuesFromFile());
        } else {
            BoilerPredictiveActivator.println("ERROR Failed to run R:" + String.join(" ", cmd) + "  error:" + processResults.outputMessage);
        }

        return 0;
    }

    private Integer getOutputEfficiency(String readings) {
        String efficiencyFloat = null;
        final Pattern efficiencyPattern = Pattern.compile(
            "^(" + '"' + ")?(?<lineNum>\\d+)(" + '"' + ")?\\s*(?<efficiencyFloat>[0-9.]+)\\s*$"
        );
        for (String efficiencyLine:readings.split("\n")) {
            BoilerPredictiveActivator.printlnDebug(efficiencyLine);

            Matcher matches = efficiencyPattern.matcher(efficiencyLine);
            if (matches.matches()) {
                efficiencyFloat = matches.group("efficiencyFloat");

                BoilerPredictiveActivator.printlnDebug("streamResults match efficiencyLine:" + " pressure:" + efficiencyFloat);
            } else {
                BoilerPredictiveActivator.printlnDebug("streamResults no match on efficiencyLine:" + efficiencyLine);
            }
        }
        Integer val = 0;
        if(efficiencyFloat != null) {
            val = Math.toIntExact((Math.round(Double.valueOf(efficiencyFloat) * 100) / 100));
            BoilerPredictiveActivator.printlnDebug("Efficiency value: " + val);
        }

        return val;
    }

    public void run() {
        BoilerPredictiveActivator.printlnDebug("CalculateFFT:run - called, state:" + (state == State.RUNNING ? "RUNNING" : (state == State.BUSY ? "BUSY" : "UNKNOWN")));

        // ensure we have initialized and in a good state
        if ( state != State.RUNNING ) {
            BoilerPredictiveActivator.println("Warning: NOT RUNNING: CalculateFFT.state = " + state );
            return;
        }

        // Indicate thread is busy
        state = State.BUSY;

        // determine if any configuration changes have been sent
        //updateConfigurations();

                //BoilerPredictiveActivator.println("Starting loop:" + new Date());
       /* try {
            // get the data and create a primitive array
            int rowCount = getSampleDataToOutputFileJSON(rInput, rFetchTime);
            if (rowCount > 0) {
                //BoilerPredictiveActivator.println("Processing " + rowCount + " new readings");
                ProcessResults processResults = new ProcessResults();
                List<String> cmd = null;

                cmd = Arrays.asList(
                    rBin.getAbsolutePath(), 
                    "--vanilla", 
                    rScript.getAbsolutePath(), 
                    rInput.getAbsolutePath()
                );
                processResults = executeProcess(cmd, true, rDir);
                //BoilerPredictiveActivator.println("Running R:" + String.join(" ", cmd));

                if (processResults.returnCode == 0) {
                    //BoilerPredictiveActivator.println("R result = " + processResults.outputMessage );

                    // send the results back into IOT Service engine as a different capability
                    streamResults(
                        configProperties.getProperty("iotGatewayMeasureURL"),
                        configProperties.getProperty("sendingDeviceAlternateId"),
                        configProperties.getProperty("sendingSensorTypeAlternateId"),
                        configProperties.getProperty("sendingCapabilityAlternateId"),
                        configProperties.getProperty("sendingSensorAlternateId"),
                        processResults.outputMessage,
                        rInput,
                        rowCount
                    );
                } else {
                    BoilerPredictiveActivator.println("ERROR Failed to run R:" + String.join(" ", cmd) + "  error:" + processResults.outputMessage);
                }
            } else {
                BoilerPredictiveActivator.printlnDebug("INFO No input data, nothing to do");
            }
        } catch(Exception e) {
            e.printStackTrace();
        }*/
        BoilerPredictiveActivator.printlnDebug("Setting state to RUNNING");
        state = State.RUNNING;

        return;
    }

    // this is made available to the engine
    @Override
    public int getPollingFreqencyMS() {
        int freq = 2000;
        if (configProperties != null) {
            String freqStr = configProperties.getProperty("pollingFrequency");
            if (freqStr != null && !freqStr.isEmpty()) {
                freq = Integer.parseInt(freqStr);
            }
        }
        return freq;
    }

    @Override
    public String getLogLevel() {
        if (configProperties != null) {
            return configProperties.getProperty("logLevel", "DEBUG");
        } else {
            return "DEBUG";
        }
    }

    private void configRestWebServer() {
        try {
            restletComponent = new Component();
            Server jettyServer = new Server(restletComponent.getContext().createChildContext(), Protocol.HTTP, 8521);
            System.out.println("Jetty server port: " + jettyServer.getPort());
            restletComponent.getServers().add(jettyServer);
            JettyServerHelper jettyServerHelper = new HttpServerHelper(jettyServer);
            org.restlet.engine.Engine.getInstance().getRegisteredServers().add(jettyServerHelper);

            this.restletComponent.getDefaultHost().attachDefault(new Route());
            this.restletComponent.start();
        } catch (Exception exception) {
            System.out.println("Error while starting the jetty server: " + exception.getMessage());
        }
    }


    ////////////////////
    // private methods
    ////////////////////

    // this is called by the super class, Calculation
    public boolean initialize(File configFile, File rDirIn) {

        System.out.println("Starting jetty server");
        configRestWebServer();
        boolean rc = false;
        BoilerPredictiveActivator.printlnDebug("CalculateFFT:initialize - called");
        // if you want to store the result to a custom table, create a table to store them.
        rc = createFFTTable();
        rDir = rDirIn;

        if (rc)  {
            InputStream input = null;

            try {
                input = new FileInputStream(configFile);

                configProperties = new Properties();
                configProperties.load(input);
                rc = true;
            } catch (IOException ex) {
                BoilerPredictiveActivator.println("initialize exception:" + ex.getMessage());
            } finally {
                if (input != null) {
                    try {
                        input.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        } 

        if (rc)  {
            // Find the R binary using an environment variable
            String keyRHome = "R_HOME";
            String rHomeDir = System.getenv(keyRHome);
            BoilerPredictiveActivator.println("INFO R_HOME[" + rHomeDir + "]");
            if ((rHomeDir == null || rHomeDir.isEmpty()) && OSArch == OS_ARCH.LINUX) {
                rHomeDir = "/usr";
                BoilerPredictiveActivator.println("INFO R_HOME not set defaulting to:" + rHomeDir);
            }
            if (rHomeDir != null) {
                rBin = new File(rHomeDir);
                if (rBin.exists()) {
                    Path filePath = Paths.get(rHomeDir, "bin", "Rscript" + (OSArch == OS_ARCH.WINDOWS ? ".exe" : ""));
                    rBin = new File(filePath.toAbsolutePath().toString());
                    if (rBin.exists()) {
                        rc = true;
                    } else {
                        BoilerPredictiveActivator.println("ERROR cannot find R binary:" + rBin.getAbsolutePath());
                        rc = false;
                    }
                } else {
                    BoilerPredictiveActivator.println("ERROR invalid R_HOME environment variable:" + rHomeDir);
                    rc = false;
                }
            } else {
                BoilerPredictiveActivator.println("ERROR cannot find R_HOME environment variable:" + keyRHome);
                rc = false;
            }
            if (!rc) {
                state = State.ERROR;
                return rc;
            }

            rScript = new File(rDir, "boilerEfficiency_csv_no_output_file.R");
            if (!rScript.exists()) {
                BoilerPredictiveActivator.println("ERROR R script does not exist:" + rScript.getAbsolutePath());
                state = State.ERROR;
                rc = false;
                return rc;
            }

            // Only used for input and created when necessary
            rInput = new File(rDir, "input_new.csv");

            // Used after fetching results, stores last fetch time for the next query
            rFetchTime = new File(rDir, "last_fetch_time.txt");

            this.state = State.RUNNING;

            BoilerPredictiveActivator.println("initialize returning TRUE");
            rc = true;
        }

        return rc;
    }


    // selects the sample data from the persistance database which is constantly being updated
    /*private int getSampleDataToOutputFileJSON(File outFile, File fetchTimeFile) {
        PSStatementObject stmt;
        String fetchTime = null;
        String measureId = null;
        int i = 0;
        int j = 0;

        try (BufferedReader readerFetch = new BufferedReader(
                    new InputStreamReader(
                        new FileInputStream(fetchTimeFile))
                    )
                ) {
            String line = null;
            while ((line = readerFetch.readLine()) != null) {
                fetchTime = line;
                BoilerPredictiveActivator.printlnDebug("Previous fetch time:" + fetchTime);
            }
            readerFetch.close();
        } catch (FileNotFoundException fnfe4) {
            BoilerPredictiveActivator.println("Fetch time file not found:" + fnfe4.getMessage());
        } catch (IOException ioe4) {
            BoilerPredictiveActivator.println("Fetch time io error:" + ioe4.getMessage());
        }

        String sql = getSqlForJsonMeasureValues(
            configProperties.getProperty("readingDeviceAlternateId"),
            configProperties.getProperty("readingSensorAlternateId"),
            configProperties.getProperty("readingSensorTypeAlternateId"),
            configProperties.getProperty("readingCapabilityAlternateId"),
            fetchTime
        );
        int rowCount = 0;
        try (Writer writer = new BufferedWriter(
                    new OutputStreamWriter(
                        new FileOutputStream(outFile))
                    )
                ) {
            writer.write(new String("Temperature, Pressure, ReadingTime\n"));
            try {
                //BoilerPredictiveActivator.println("Executing query:" + new Date());
                stmt = persistenceClient.executeQuery(sql);
                //BoilerPredictiveActivator.println("Finished query:" + new Date());
                if (stmt.hasResultList()) {
                    Iterator<List<PSDataObject>> rows = stmt.getResultList().iterator();
                    while(rows.hasNext()){
                        Iterator<PSDataObject> columns = rows.next().iterator();
                        while(columns.hasNext()){
                            PSDataObject column = columns.next();
                            BoilerPredictiveActivator.printlnDebug("Column name:" + column.getColumnName());
                            try {
                                BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON JSON returned:" + column.getValue().toString());
                                JSONObject measuresObj = new JSONObject(column.getValue().toString());
                                JSONArray measures = measuresObj.getJSONArray("measures");
                                JSONArray props = null;
                                JSONObject objectInArray = null;
                                fetchTime = measuresObj.getString("fetchTime");
                                String value = null;

                                if (fetchTime != null) {
                                    BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON Writing out fetch time:" + fetchTime);
                                    // This is the value we last read data from the Persistence Service (PS)
                                    // We will use this value each time we query the PS to 
                                    // ensure we are only addressing data just arrived
                                    try (Writer writerFetch = new BufferedWriter(
                                                new OutputStreamWriter(
                                                    new FileOutputStream(fetchTimeFile))
                                                )
                                            ) {
                                        writerFetch.write(fetchTime);
                                        writerFetch.close();
                                    } catch (FileNotFoundException fnfe4) {
                                        BoilerPredictiveActivator.println("Fetch time file not found:" + fnfe4.getMessage());
                                    } catch (IOException ioe4) {
                                        BoilerPredictiveActivator.println("Fetch time io error:" + ioe4.getMessage());
                                    }
                                }
                                for (i = 0; i < measures.length(); i++) {
                                    rowCount++;
                                    objectInArray = measures.getJSONObject(i);
                                    measureId = objectInArray.getString("measureId");

                                    //System.out.println(
                                    //    new String(" " + objectInArray.getString("measureId") + String.join("", Collections.nCopies(40, " "))).substring(0, 39) +
                                    //    new String(" " + objectInArray.getString("profileId") + String.join("", Collections.nCopies(6, " "))).substring(0, 5) +
                                    //    new String(" " + objectInArray.getString("objectId") + String.join("", Collections.nCopies(27, " "))).substring(0, 26) +
                                    //    new String(" " + objectInArray.getString("deviceAddress") + String.join("", Collections.nCopies(20, " "))).substring(0, 19) +
                                    //    new String(" " + objectInArray.getString("arrivalTime") + String.join("", Collections.nCopies(20, " "))).substring(0, 19) +
                                    //    new String(" " + objectInArray.getString("values"))
                                    //);

                                    // Must have all 3 columns for a valid reading
                                    //   Temperature, Pressure, ReadingTime
                                    writer.write(objectInArray.getString("values") + "\n");
                                }
                            } catch (JSONException e) {
                                BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON could not parse JSON error:" + column.getValue().toString());
                                e.printStackTrace();
                            }
                        }
                    }
                } else {
                    if (stmt.hasErrors()) {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON error SQLCODE:" + stmt.getSQLCode() + "  " + stmt.getMessage());
                    } else {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON no data");
                    }
                }
            } catch (PersistenceException pe) {
                // TODO Auto-generated catch block
                pe.printStackTrace();
            } catch ( Exception e ) {
                e.printStackTrace();
            }
            writer.close();
        } catch (FileNotFoundException fnfe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input file not found:" + fnfe.getMessage());
        } catch (IOException ioe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input io error:" + ioe.getMessage());
        }
        BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON returning rowCount:" + rowCount);
        //BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON returning rowCount:" + rowCount);
        return rowCount;
    }*/

    /*
     * This version uses the MEASURE_PROPERTY table and loops through the values
     * building the output.
     * It was too slow, replaced with using the deprecated MEASURE.MEASURE_VALUE column
     *
    private int getSampleDataToOutputFileJSON(File outFile, File fetchTimeFile) {
        PSStatementObject stmt;
        StringBuilder sb = null;
        String fetchTime = null;
        String measureId = null;
        int i = 0;
        int j = 0;

        try (BufferedReader readerFetch = new BufferedReader(
                    new InputStreamReader(
                        new FileInputStream(fetchTimeFile))
                    )
                ) {
            String line = null;
            while ((line = readerFetch.readLine()) != null) {
                fetchTime = line;
                BoilerPredictiveActivator.printlnDebug("Previous fetch time:" + fetchTime);
            }
            readerFetch.close();
        } catch (FileNotFoundException fnfe4) {
            BoilerPredictiveActivator.println("Fetch time file not found:" + fnfe4.getMessage());
        } catch (IOException ioe4) {
            BoilerPredictiveActivator.println("Fetch time io error:" + ioe4.getMessage());
        }

        String sql = getSqlForJsonMeasureValues(
            configProperties.getProperty("readingDeviceAlternateId"),
            configProperties.getProperty("readingSensorAlternateId"),
            configProperties.getProperty("readingSensorTypeAlternateId"),
            configProperties.getProperty("readingCapabilityAlternateId"),
            fetchTime
        );
        int rowCount = 0;
        try (Writer writer = new BufferedWriter(
                    new OutputStreamWriter(
                        new FileOutputStream(outFile))
                    )
                ) {
            writer.write(new String("Temperature, Pressure, ReadingTime\n"));
            try {
                BoilerPredictiveActivator.println("Executing query:" + new Date());
                stmt = persistenceClient.executeQuery(sql);
                BoilerPredictiveActivator.println("Finished query:" + new Date());
                if (stmt.hasResultList()) {
                    Iterator<List<PSDataObject>> rows = stmt.getResultList().iterator();
                    while(rows.hasNext()){
                        Iterator<PSDataObject> columns = rows.next().iterator();
                        while(columns.hasNext()){
                            PSDataObject column = columns.next();
                            BoilerPredictiveActivator.printlnDebug("Column name:" + column.getColumnName());
                            try {
                                BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON JSON returned:" + column.getValue().toString());
                                JSONObject measuresObj = new JSONObject(column.getValue().toString());
                                JSONArray measures = measuresObj.getJSONArray("measures");
                                JSONArray props = null;
                                JSONObject objectInArray = null;
                                fetchTime = measuresObj.getString("fetchTime");
                                String value = null;

                                if (fetchTime != null) {
                                    BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON Writing out fetch time:" + fetchTime);
                                    // This is the value we last read data from the Persistence Service (PS)
                                    // We will use this value each time we query the PS to 
                                    // ensure we are only addressing data just arrived
                                    try (Writer writerFetch = new BufferedWriter(
                                                new OutputStreamWriter(
                                                    new FileOutputStream(fetchTimeFile))
                                                )
                                            ) {
                                        writerFetch.write(fetchTime);
                                        writerFetch.close();
                                    } catch (FileNotFoundException fnfe4) {
                                        BoilerPredictiveActivator.println("Fetch time file not found:" + fnfe4.getMessage());
                                    } catch (IOException ioe4) {
                                        BoilerPredictiveActivator.println("Fetch time io error:" + ioe4.getMessage());
                                    }
                                }
                                for (i = 0; i < measures.length(); i++) {
                                    sb = new StringBuilder();
                                    rowCount++;
                                    objectInArray = measures.getJSONObject(i);
                                    measureId = objectInArray.getString("measureId");

                                    //System.out.println(
                                    //    new String(" " + objectInArray.getString("measureId") + String.join("", Collections.nCopies(40, " "))).substring(0, 39) +
                                    //    new String(" " + objectInArray.getString("profileId") + String.join("", Collections.nCopies(6, " "))).substring(0, 5) +
                                    //    new String(" " + objectInArray.getString("objectId") + String.join("", Collections.nCopies(27, " "))).substring(0, 26) +
                                    //    new String(" " + objectInArray.getString("deviceAddress") + String.join("", Collections.nCopies(20, " "))).substring(0, 19) +
                                    //    new String(" " + objectInArray.getString("arrivalTime") + String.join("", Collections.nCopies(20, " "))).substring(0, 19) +
                                    //    new String(" " + objectInArray.getString("value"))
                                    //);
                                    props = objectInArray.getJSONArray("values");
                                    for (j = 0; j < props.length(); j++) {
                                        objectInArray = props.getJSONObject(j);

                                        switch (objectInArray.getString("type")) {
                                            case "double":
                                                value = String.valueOf(objectInArray.getDouble("value"));
                                                break;
                                            case "float":
                                                value = String.valueOf(objectInArray.getDouble("value"));
                                                break;
                                            case "integer":
                                                value = String.valueOf(objectInArray.getInt("value"));
                                                break;
                                            case "long":
                                                value = String.valueOf(objectInArray.getLong("value"));
                                                break;
                                            case "boolean":
                                                value = String.valueOf(objectInArray.getBoolean("value"));
                                                break;
                                            case "binary":
                                                value = "binary";
                                                break;
                                            case "date":
                                                value = objectInArray.getString("value");
                                                break;
                                            default:
                                                value = objectInArray.getString("value");
                                                break;
                                        }

                                        if (j < 3) {
                                            // R is only interested in the first 3 properties which
                                            // are temperature, pressure, readingTime
                                            if (sb.length() > 0) {
                                                sb.append(", ");
                                            }
                                            sb.append(value);
                                            BoilerPredictiveActivator.printlnDebug("Column value appended:" + sb.toString() + " count:" + j);
                                        }

                                        //System.out.println(
                                        //    new String(" " + String.join("", Collections.nCopies(40, " "))).substring(0, 39) +
                                        //    new String(" " + objectInArray.getString("ID") + String.join("", Collections.nCopies(6, " "))).substring(0, 5) +
                                        //    new String(" " + objectInArray.getString("name") + String.join("", Collections.nCopies(27, " "))).substring(0, 26) +
                                        //    new String(" " + objectInArray.getString("type") + String.join("", Collections.nCopies(20, " "))).substring(0, 19) +
                                        //    new String(" " + value)
                                        //);
                                    }
                                    if (j >= 3) {
                                        // Must have all 3 columns for a valid reading
                                        //   Temperature, Pressure, ReadingTime
                                        BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON:" + sb.toString());
                                        //BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON:" + sb.toString());
                                        sb.append("\n");
                                        writer.write(sb.toString());
                                    } else {
                                        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON: Not enough values for measureId:" + measureId + " count:" + j + " fetchTime:" + fetchTime);
                                        for (j = 0; j < props.length(); j++) {
                                            objectInArray = props.getJSONObject(j);
                                            BoilerPredictiveActivator.println("Column j:" + j + " value:" + objectInArray.getString("value"));
                                        }
                                    }
                                }
                            } catch (JSONException e) {
                                BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON could not parse JSON error:" + column.getValue().toString());
                                e.printStackTrace();
                            }
                        }
                    }
                } else {
                    if (stmt.hasErrors()) {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON error SQLCODE:" + stmt.getSQLCode() + "  " + stmt.getMessage());
                    } else {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON no data");
                    }
                }
            } catch (PersistenceException pe) {
                // TODO Auto-generated catch block
                pe.printStackTrace();
            } catch ( Exception e ) {
                e.printStackTrace();
            }
            writer.close();
        } catch (FileNotFoundException fnfe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input file not found:" + fnfe.getMessage());
        } catch (IOException ioe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON input io error:" + ioe.getMessage());
        }
        BoilerPredictiveActivator.printlnDebug("getSampleDataToOutputFileJSON returning rowCount:" + rowCount);
        BoilerPredictiveActivator.println("getSampleDataToOutputFileJSON returning rowCount:" + rowCount);
        return rowCount;
    }
    */

    /* 
     * Flipped over to using the JSON output since we didn't need to iterate over the child 
     * table for the MEASURE_PROPERTY values
     *
    private int getSampleDataToOutputFileSQL(File outFile, File fetchTimeFile) {
        PSStatementObject stmt;
        String sql = getSqlForMeasureValues(
            requiredSamples.getValue(),
            configProperties.getProperty("readingDeviceAlternateId"),
            configProperties.getProperty("readingSensorTypeAlternateId"),
            configProperties.getProperty("readingCapabilityAlternateId")
        );
        int rowCount = 0;
        int columnCount = 0;
        try (Writer writer = new BufferedWriter(
                    new OutputStreamWriter(
                        new FileOutputStream(outFile))
                    )
                ) {
            writer.write(new String("Temperature, Pressure, ReadingTime\n"));
            try {
                stmt = persistenceClient.executeQuery(sql);
                if (stmt.hasResultList()) {
                    Iterator<List<PSDataObject>> rows = stmt.getResultList().iterator();
                    while(rows.hasNext()){
                        StringBuilder sb = new StringBuilder();
                        Iterator<PSDataObject> columns = rows.next().iterator();
                        columnCount = 0;
                        while(columns.hasNext()){
                            rowCount++;
                            columnCount++;
                            PSDataObject column = columns.next();
                            BoilerPredictiveActivator.println("Column name:" + column.getColumnName());
                            if (columnCount < 3) {
                                // We are only interested in the Temperature and Pressure values
                                if (sb.length() > 0) {
                                    sb.append(", ");
                                }
                                sb.append(column.getValue().toString());
                                BoilerPredictiveActivator.println("Column value appended:" + sb.toString() + " count:" + columnCount);
                            }
                            if (rowCount == 3 && column.getColumnName().equals("FETCH_TIME")) {
                                BoilerPredictiveActivator.println("Writing out fetch time:" + column.getValue().toString());
                                // This is the value we last read data from the Persistence Service (PS)
                                // We will use this value each time we query the PS to 
                                // ensure we are only addressing data just arrived
                                try (Writer writerFetch = new BufferedWriter(
                                            new OutputStreamWriter(
                                                new FileOutputStream(fetchTimeFile))
                                            )
                                        ) {
                                    writerFetch.write(column.getValue().toString());
                                    writerFetch.close();
                                } catch (FileNotFoundException fnfe4) {
                                    BoilerPredictiveActivator.println("Fetch time file not found:" + fnfe4.getMessage());
                                } catch (IOException ioe4) {
                                    BoilerPredictiveActivator.println("Fetch time io error:" + ioe4.getMessage());
                                }
                            }
                        }
                        if (rowCount >= 3) {
                            // Must have all 3 columns for a valid reading
                            //   Temperature, Pressure, ReadingTime
                            BoilerPredictiveActivator.println("getSampleDataToOutputFileSQL:" + sb.toString());
                            sb.append("\n");
                            writer.write(sb.toString());
                        }
                    }
                } else {
                    if (stmt.hasErrors()) {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileSQL error SQLCODE:" + stmt.getSQLCode() + "  " + stmt.getMessage());
                    } else {
                        BoilerPredictiveActivator.println("getSampleDataToOutputFileSQL no data");
                    }
                }
                writer.close();
            } catch (PersistenceException pe) {
                // TODO Auto-generated catch block
                pe.printStackTrace();
            } catch ( Exception e ) {
                e.printStackTrace();
            }
        } catch (FileNotFoundException fnfe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileSQL input file not found:" + fnfe.getMessage());
            return 0;
        } catch (IOException ioe) {
            BoilerPredictiveActivator.println("getSampleDataToOutputFileSQL input io error:" + ioe.getMessage());
            return 0;
        }
        return rowCount;
    }
    */

    // go to the database and see if any of the configurations have changed
    /*private void updateConfigurations() {
        requiredSamples.update(persistenceClient);
        timeVariance.update(persistenceClient);
    }

    // convet the result set into an array of Doubles
    private ArrayList<Double> getValuesAsDoubles( PSStatementObject statementObject ) {
        ArrayList<Double> values = new ArrayList<>();
        BoilerPredictiveActivator.printlnDebug("getValuesAsDoubles start-------------");
        if (statementObject.hasResultList()) {
            statementObject.getResultList().forEach((row) -> {
                String s = row.get(2).getValue().toString();
                BoilerPredictiveActivator.printlnDebug(s.toString());

                try {
                    Double d = Double.valueOf(s);
                    values.add(d);
                } catch (NumberFormatException nfe) {
                    StringBuffer errMsg = new StringBuffer("Error: not a number: ");
                    row.forEach((column) -> {
                        errMsg.append(column.getValue() + "(" + column.getColumnName() + ":" + column.getMetadata() + "), ");
                    });
                    BoilerPredictiveActivator.printlnDebug(s.toString());
                }
            });
        } else {
            BoilerPredictiveActivator.printlnDebug(" ResultSet is empty");
        }
        BoilerPredictiveActivator.printlnDebug("getValuesAsDoubles end---------------");
        return values;
    }

    // SQL used to select the data
    private String getSqlForJsonMeasureValues( String deviceAddress, String sensorId, String profileId, String objectId, String fetchTime ) {
        // Check for NULL and set appropriate value for COALESCE
        if (fetchTime == null || fetchTime.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: fetchTime is invalid:" + fetchTime);
            fetchTime = "NULL";
        } else {
            fetchTime = "'" + fetchTime + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new fetchTime:" + fetchTime);
        }
        if (deviceAddress == null || deviceAddress.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: deviceAddress is invalid:" + deviceAddress);
            deviceAddress = "NULL";
        } else {
            deviceAddress = "'" + deviceAddress + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new deviceAddress:" + deviceAddress);
        }
        if (sensorId == null || sensorId.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: sensorId is invalid:" + sensorId);
            sensorId = "NULL";
        } else {
            sensorId = "'" + sensorId + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new sensorId:" + sensorId);
        }
        String sql = 
                  "SELECT '{\"measures\": ['                                                                     " +
                  "          ||LIST(                                                                             " +
                  "             '{\"measureId\": \"' || string(m.MEASURE_ID) || '\"'                             " +
                  "          || ', \"measureName\": \"' || m.MEASURE_NAME || '\"'                                " +
                  "          || ', \"profileId\": \"' || m.PROFILE_ID || '\"'                                    " +
                  "          || ', \"objectId\": \"' || m.OBJECT_ID || '\"'                                      " +
                  "          || ', \"deviceAddress\": \"' || m.DEVICE_ADDRESS || '\"'                            " +
                  "          || ', \"sensorId\": \"' || m.SENSOR_ID || '\"'                                      " +
                  "          || ', \"arrivalTime\": \"' || string(m.DATE_RECEIVED) || '\"'                       " +
                  "          || ', \"values\": \"' || string(m.MEASURE_VALUES) || '\"'                           " +
                  "          || '}'                                                                              " +
                  "             , ',' ORDER BY m.LAST_MODIFIED DESC, MEASURE_ID)                                 " +
                  "          || '],'                                                                             " +
                  "       || '\"fetchTime\": \"' || string(CURRENT UTC TIMESTAMP) || '\"}'                       " +
                  "       AS MeasureJSON                                                                         " +
                  "  FROM (                                                                                      " +
                  "          SELECT m.MEASURE_ID                                                                 " +
                  "               , REPLACE(CAST(m.MEASURE_VALUE as VARCHAR(1000)), ' ', ', ') as MEASURE_VALUES " +
                  "               , m.PROFILE_ID                                                                 " +
                  "               , m.OBJECT_ID                                                                  " +
                  "               , m.DATE_RECEIVED                                                              " +
                  "               , m.DEVICE_ADDRESS                                                             " +
                  "               , m.SENSOR_ID                                                                  " +
                  "               , m.LAST_MODIFIED                                                              " +
                  "               , mt.MEASURE_NAME                                                              " +
                  "            FROM EFPS.MEASURE m                                                               " +
                  "            JOIN EFPS.MEASURE_TYPE mt                                                         " +
                  "              ON (m.PROFILE_ID = mt.PROFILE_ID AND                                            " +
                  "                  m.OBJECT_ID = mt.OBJECT_ID)                                                 " +
                  "           WHERE m.PROFILE_ID = '" + profileId + "'                                           " +
                  "             AND m.OBJECT_ID = '" + objectId + "'                                             " +
                  "             AND m.DEVICE_ADDRESS = COALESCE(" + deviceAddress + ", m.DEVICE_ADDRESS)         " +
                  "             AND m.SENSOR_ID = COALESCE(" + sensorId + ", m.SENSOR_ID)                        " +
                  "             AND m.LAST_MODIFIED > COALESCE(" + fetchTime + ", '1970-1-1')                    " +
                  "             AND m.LAST_MODIFIED > DATEADD(MINUTE, -2, CURRENT UTC TIMESTAMP)                 " +
                  "           ORDER BY m.LAST_MODIFIED ASC                                                       " +
                  "       ) m                                                                                    ";

        BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: ============");
        BoilerPredictiveActivator.printlnDebug(sql);
        //BoilerPredictiveActivator.println(sql);

        return sql;
    }*/

    /*
     * This one uses the MEASURE_PROPERTY table, but it is too slow.
     * The MEASURE.MEASURE_VALUES column has everything we need
     *
    private String getSqlForJsonMeasureValues( String deviceAddress, String sensorId, String profileId, String objectId, String fetchTime ) {
        // Check for NULL and set appropriate value for COALESCE
        if (fetchTime == null || fetchTime.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: fetchTime is invalid:" + fetchTime);
            fetchTime = "NULL";
        } else {
            fetchTime = "'" + fetchTime + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new fetchTime:" + fetchTime);
        }
        if (deviceAddress == null || deviceAddress.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: deviceAddress is invalid:" + deviceAddress);
            deviceAddress = "NULL";
        } else {
            deviceAddress = "'" + deviceAddress + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new deviceAddress:" + deviceAddress);
        }
        if (sensorId == null || sensorId.isEmpty()) {
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: sensorId is invalid:" + sensorId);
            sensorId = "NULL";
        } else {
            sensorId = "'" + sensorId + "'";
            BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: new sensorId:" + sensorId);
        }
        String sql = 
                  "SELECT '{\"measures\": ['                                                                 " +
                  "          ||LIST(                                                                         " +
                  "             '{\"measureId\": \"' || string(m.MEASURE_ID) || '\"'                         " +
                  "          || ', \"measureName\": \"' || m.MEASURE_NAME || '\"'                            " +
                  "          || ', \"profileId\": \"' || m.PROFILE_ID || '\"'                                " +
                  "          || ', \"objectId\": \"' || m.OBJECT_ID || '\"'                                  " +
                  "          || ', \"deviceAddress\": \"' || m.DEVICE_ADDRESS || '\"'                        " +
                  "          || ', \"sensorId\": \"' || m.SENSOR_ID || '\"'                                  " +
                  "          || ', \"arrivalTime\": \"' || string(m.DATE_RECEIVED) || '\"'                   " +
                  "          || ', \"value\": \"' || m.MEASURE_VALUE || '\"'                                 " +
                  "          || ', \"values\": ' || m.MEASURE_VALUES                                         " +
                  "          || '}'                                                                          " +
                  "             , ',' ORDER BY m.LAST_MODIFIED DESC, MEASURE_ID)                             " +
                  "          || '],'                                                                         " +
                  "       || '\"fetchTime\": \"' || string(CURRENT UTC TIMESTAMP) || '\"}'                   " +
                  "       AS MeasureJSON                                                                     " +
                  "  FROM (                                                                                  " +
                  "          SELECT m.MEASURE_ID                                                             " +
                  "               , m.MEASURE_VALUE                                                          " +
                  "               , mprop.PROPERTY_ARRAY as MEASURE_VALUES                                   " +
                  "               , m.PROFILE_ID                                                             " +
                  "               , m.OBJECT_ID                                                              " +
                  "               , m.DATE_RECEIVED                                                          " +
                  "               , m.DEVICE_ADDRESS                                                         " +
                  "               , m.SENSOR_ID                                                              " +
                  "               , m.LAST_MODIFIED                                                          " +
                  "               , mt.MEASURE_NAME                                                          " +
                  "            FROM EFPS.MEASURE m                                                           " +
                  "            JOIN EFPS.MEASURE_TYPE mt                                                     " +
                  "              ON (m.PROFILE_ID = mt.PROFILE_ID AND                                        " +
                  "                  m.OBJECT_ID = mt.OBJECT_ID)                                             " +
                  "            JOIN (                                                                        " +
                  "                  SELECT mp.MEASURE_ID                                                    " +
                  "                       , '[' ||                                                           " +
                  "                         LIST(                                                            " +
                  "                            '{\"ID\": \"' || mtp.PROP_SEQ || '\"' ||                      " +
                  "                            ', \"name\": \"' || mp.PROP_ID || '\"' ||                     " +
                  "                            ', \"type\": \"' || tm.TYPE_NAME || '\"' ||                   " +
                  "                            ', \"value\": ' ||                                            " +
                  "                            CASE tm.TYPE_NAME                                             " +
                  "                            WHEN 'boolean' THEN                                           " +
                  "                                 CASE CAST(mp.PROP_VALUE AS VARCHAR(12))                  " +
                  "                                 WHEN 'true'  THEN 'true'                                 " +
                  "                                 WHEN '1'     THEN 'true'                                 " +
                  "                                 WHEN 'false' THEN 'false'                                " +
                  "                                 WHEN '0'     THEN 'false'                                " +
                  "                                 END CASE                                                 " +
                  "                            WHEN 'string' THEN                                            " +
                  "                                 '\"' || CAST(mp.PROP_VALUE AS LONG VARCHAR) || '\"'      " +
                  "                            WHEN 'date' THEN                                              " +
                  "                                 '\"' || CAST(mp.PROP_VALUE AS LONG VARCHAR) || '\"'      " +
                  "                            WHEN 'binary' THEN CAST(mp.PROP_VALUE AS VARCHAR(102))        " +
                  "                            ELSE CAST(mp.PROP_VALUE AS VARCHAR(102))                      " +
                  "                            END CASE ||                                                   " +
                  "                            '}'                                                           " +
                  "                            ,                                                             " +
                  "                            ', ' ORDER BY mtp.PROP_SEQ                                    " +
                  "                          ) || ']' PROPERTY_ARRAY                                         " +
                  "                     FROM \"EFPS\".\"MEASURE_PROPERTY\" mp                                " +
                  "                     JOIN \"EFPS\".\"MEASURE_TYPE_PROPERTY\" mtp                          " +
                  "                       ON (mp.PROFILE_ID = mtp.PROFILE_ID AND                             " +
                  "                           mp.OBJECT_ID = mtp.OBJECT_ID   AND                             " +
                  "                           mp.PROP_ID = mtp.PROP_ID)                                      " +
                  "                     JOIN \"EFPS\".\"TYPE_MAPPER\" tm                                     " +
                  "                       ON (mtp.TYPE_ID = tm.TYPE_ID)                                      " +
                  "                    WHERE mp.PROFILE_ID = '" + profileId + "'                             " +
                  "                      AND mp.OBJECT_ID = '" + objectId + "'                               " +
                  "                      AND mp.LAST_MODIFIED > COALESCE(" + fetchTime + ", '1970-1-1')      " +
                  "                      AND mp.LAST_MODIFIED > DATEADD(MINUTE, -2, CURRENT UTC TIMESTAMP)   " +
                  "                    GROUP BY mp.MEASURE_ID                                                " +
                  "                  ) mprop                                                                 " +
                  "              ON (m.MEASURE_ID = mprop.MEASURE_ID)                                        " +
                  "           WHERE m.PROFILE_ID = '" + profileId + "'                                       " +
                  "             AND m.OBJECT_ID = '" + objectId + "'                                         " +
                  "             AND m.DEVICE_ADDRESS = COALESCE(" + deviceAddress + ", m.DEVICE_ADDRESS)     " +
                  "             AND m.SENSOR_ID = COALESCE(" + sensorId + ", m.SENSOR_ID)                    " +
                  "             AND m.LAST_MODIFIED > COALESCE(" + fetchTime + ", '1970-1-1')                " +
                  "             AND m.LAST_MODIFIED > DATEADD(MINUTE, -2, CURRENT UTC TIMESTAMP)             " +
                  "           ORDER BY m.LAST_MODIFIED ASC                                                   " +
                  "       ) m                                                                                ";

        BoilerPredictiveActivator.printlnDebug("getSqlForJsonMeasureValues: ============");
        BoilerPredictiveActivator.printlnDebug(sql);
        //BoilerPredictiveActivator.println(sql);

        return sql;
    }
    */

    /*private String getSqlForMeasureValues( String requiredCount, String deviceAddress, String profileId, String objectId ) {
        String sql = "SELECT TOP " + requiredCount
                + "          CAST(m.MEASURE_VALUE AS  VARCHAR(34)) MEASURE_VALUE,  "
                + "          m.DATE_RECEIVED, "
                + "          CURRENT TIMESTAMP AS FETCH_TIME "
                + "     FROM EFPS.MEASURE m "
                + "    WHERE m.PROFILE_ID = '" + profileId + "'"
                + "      AND m.OBJECT_ID = '" + objectId + "'"
                + "      AND m.DEVICE_ADDRESS = '" + deviceAddress + "'"
                + " ORDER BY m.DATE_RECEIVED DESC";

        BoilerPredictiveActivator.printlnDebug("getSqlForMeasureValues: ============");
        BoilerPredictiveActivator.printlnDebug(sql);

        return sql;
    }*/

    // create a table to store the results (if you want... ) not implemented in this sample
    private boolean createFFTTable() {
        boolean rc = false;
        BoilerPredictiveActivator.printlnDebug("CalculateFFT:createFFTTable - called");

        String sql = "CREATE TABLE FFT ( "
                + "              id INT PRIMARY KEY DEFAULT AUTOINCREMENT, "
                + "          device VARCHAR(34), "
                + "           input TEXT NOT NULL, "
                + "          output TEXT NOT NULL, "
                + " requiredSamples int NOT NULL, "
                + "        calcTime DATE DEFAULT CURRENT UTC TIMESTAMP); ";

        Table table = new Table(persistenceClient);
        try {
            // if table already exists, it will not modify it
            table.createIfNeeded(sql, "FFT");
            rc = true;
            BoilerPredictiveActivator.println("CalculateFFT:createFFTTable - success");
        } catch (PersistenceException e) {
            // TODO Auto-generated catch block
            BoilerPredictiveActivator.println("ERROR: CalculateFFT:createFFTTable - failed");
            state = State.ERROR;
            e.printStackTrace();
        }
        return rc;
    }

    // send the results back into IOTS using a different sensorType/capability for processing again
    /*private void streamResults(String measuresUrl, String device, String sensorTypeAlternateId, String capabilityAlternateId, String sensorAlternateId, String readings, File inputFile, int rowCount) {
        String jsonPayload = null;
        String lineNum = null;
        String efficientyFloat = null;
        String[] readingDates;
        int i = 0;
        String line = null;
        String readingTime = null;
        Date now = null;
        Matcher matches = null;
        SimpleDateFormat epochDateFormat = new SimpleDateFormat("");
        SimpleDateFormat isoDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");
        BoilerPredictiveActivator.printlnDebug("Sending data to streaming..." + measuresUrl + device );

        readingDates = new String[rowCount];

        *//*
         * Line example with 3 values, Temperature, Pressure, ReadingTime:
         *     32.0, 60.0, 1538590241894
         *
         * Regex explanation:
         *     http://stackoverflow.com/questions/415582/regex-named-groups-in-java
         *     ^                            - From beginning of string
         *     (?<temperatureFloat>[2-9.]+) - Match digits and periods call the group "temperatureFloat"
         *     ,                            - Match a comma
         *     \\s*                         - Ignore whitespace
         *     (?<pressureFloat>[2-9.]+)    - Match digits and periods call the group "pressureFloat"
         *     ,                            - Match a comma
         *     \\s*                         - Ignore whitespace
         *     (?<readingTime>\\d+)         - Match digits call the group "readingTime"
         *     \\s*                         - Ignore whitespace
         *     $                            - Match the end of the string
         *//*
        final Pattern datePattern = Pattern.compile(
            "^(?<temperatureFloat>[2-9.]+),\\s*(?<pressureFloat>[0-9.]+),\\s*(?<readingTime>\\d+)\\s*$"
        );

        try (BufferedReader readerInput = new BufferedReader(
                    new InputStreamReader(
                        new FileInputStream(inputFile))
                    )
                ) {
            line = null;
            i = 0;
            int lines = 0;
            while ((line = readerInput.readLine()) != null) {
                lines++;
                //BoilerPredictiveActivator.printlnDebug("streamResults read line:" + line);
                matches = datePattern.matcher(line);
                if (matches.matches()) {
                    readingTime = matches.group("readingTime");

                    //BoilerPredictiveActivator.printlnDebug("streamResults readingTime:" + readingTime);
                    Date d;
                    d = new Date(Long.parseLong(readingTime));
                    readingDates[i] = isoDateFormat.format(d);
                    //BoilerPredictiveActivator.printlnDebug("streamResults match readingTime:" + readingTime + "  formated:" + readingDates[i]);
                    i++;
                }
            }
            readerInput.close();
            BoilerPredictiveActivator.printlnDebug("streamResults processed lines:" + lines);
        } catch (FileNotFoundException fnfe4) {
            BoilerPredictiveActivator.println("streamResults input file not found:" + fnfe4.getMessage());
        } catch (IOException ioe4) {
            BoilerPredictiveActivator.println("streamResults input io error:" + ioe4.getMessage());
        }

        *//*
         * Output from R:
         *    "efficiency"
         *    "3" 30.8770967770818
         *    "4" 30.9206268162867
         *
         * Regex explanation:
         *     http://stackoverflow.com/questions/415582/regex-named-groups-in-java
         *     ^                         - From beginning of string
         *     (")?                      - Optionally match a double quote
         *     (?<lineNum>\\d+)          - Match digits and if found call the group "lineNum"
         *     (")?                      - Optionally match a double quote
         *     \\s*                      - Ignore whitespace
         *     (?<efficiencyFloat>[2-9.]+) - Match digits and periods and if found call the group "efficientyFloat"
         *     \\s*                      - Ignore whitespace
         *     $                         - Match the end of the string
         *//*
        final Pattern efficiencyPattern = Pattern.compile(
            "^(" + '"' + ")?(?<lineNum>\\d+)(" + '"' + ")?\\s*(?<efficiencyFloat>[0-9.]+)\\s*$"
        );

        i = 0;
        for (String efficiencyLine:readings.split("\n")) {
            BoilerPredictiveActivator.printlnDebug(efficiencyLine);

            matches = efficiencyPattern.matcher(efficiencyLine);
            if (matches.matches()) {
                lineNum = matches.group("lineNum");
                efficientyFloat = matches.group("efficiencyFloat");

                BoilerPredictiveActivator.printlnDebug("streamResults match efficiencyLine:" + lineNum + " pressure:" + efficientyFloat);
                now = new Date();
                if (readingDates[i] == null || readingDates[i].equals("null")) {
                    readingDates[i] = isoDateFormat.format(now);
                    BoilerPredictiveActivator.printlnDebug("streamResults overriding date with:" + readingDates[i] + " for:" + i);
                //} else {
                //    BoilerPredictiveActivator.println("streamResults original readingTime:" + readingDates[i] + " override value:" + isoDateFormat.format(now) + " for:" + i);
                }
                // format the payload
                jsonPayload = String.format(
                    "{\"sensorTypeAlternateId\": \"%s\", \"capabilityAlternateId\": \"%s\", \"sensorAlternateId\": \"%s\", \"timestamp\": \"%s\", \"measures\": [[%s, \"%s\"]]}",
                    sensorTypeAlternateId,
                    capabilityAlternateId,
                    sensorAlternateId,
                    readingDates[i],
                    efficientyFloat,
                    readingDates[i]
                );
                //BoilerPredictiveActivator.println("streamResults payload:" + jsonPayload);
                i++;

                URI uri = null;
                try {
                    if (measuresUrl.endsWith("/")) {
                        uri = new URI(measuresUrl + device);
                    } else {
                        uri = new URI(measuresUrl + "/" + device);
                    }
                    sendPayload(uri, jsonPayload);
                } catch (Exception e) {
                    StringWriter sw = new StringWriter();
                    PrintWriter pw = new PrintWriter(sw);
                    e.printStackTrace(pw);

                    BoilerPredictiveActivator.println("ERROR: streamResults Could not stream transformed results back to streaming: " + e.getMessage() + " URL:" + uri + "\n" + e + " - " + sw);
                }
            } else {
                BoilerPredictiveActivator.printlnDebug("streamResults no match on efficiencyLine:" + efficiencyLine);
            }
        }
    }*/

    private void sendPayload(URI uri, String payload) throws Exception {
        String protocol = uri.getScheme();
        if (protocol.equalsIgnoreCase("http")) {
            sendPayloadREST(uri, payload);
        } else if (protocol.equalsIgnoreCase("mqtt")) {
            sendPayloadMQTT(uri, payload);
        }
    }

    private static void sendPayloadREST(URI uri, String payload) throws IOException {
        URL url = uri.toURL();
        HttpURLConnection http = (HttpURLConnection) url.openConnection();
        
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        http.setRequestMethod("POST");
        http.setDoOutput(true);
        http.setFixedLengthStreamingMode(payloadBytes.length);
        http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

        // connect and send data
        http.connect();
        try (OutputStream os = http.getOutputStream()) {
            os.write(payloadBytes);
        }

        int responseCode = http.getResponseCode();
        //BoilerPredictiveActivator.println("INFO: streamResults RC[" + responseCode + "] URL[" + (measuresUrl + device) + "] Payload[" + jsonPayload + "]");
        
        if (responseCode < 200 && responseCode >= 300) {
            BoilerPredictiveActivator.println("ERROR: Sending measure to IoT Gateway failed RC[" + responseCode + "] URL[" + url + "] Payload[" + payload + "]");
        }
    }

    private static void sendPayloadMQTT(URI uri, String payload) throws IOException, MqttSecurityException, MqttException {
        String topic = uri.getPath();
        if (topic.isEmpty() || topic.equals("/")) {
            throw new IllegalArgumentException("MQTT URL does not include topic in the path");
        }

        // Remove the leading slash
        topic = topic.substring(1);

        MqttClient client = null;
        try {
            client = createMqttClient(uri);
            BoilerPredictiveActivator.println("Publishing to topic " + topic + ": " + payload); 
            client.publish(topic, payload.getBytes(), 0, true);
        } finally {
            if (client != null) {
                client.disconnect();
                client.close();
            }
        }
    }

    private static MqttClient createMqttClient(URI uri) throws MqttException {
        String scheme = uri.getScheme();
        if (scheme.equals("mqtt")) {
            scheme = "tcp";
        } else if (scheme.equals("mqtts")) {
            scheme = "ssl";
        }

        int port = uri.getPort();
        if (port <= 0) {
            port = 1883;
        }

        String serverUri = String.format("%s://%s:%d", scheme, uri.getHost(), uri.getPort());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(10);

        String userInfo = uri.getUserInfo();
        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            if (parts.length > 1) {
                options.setUserName(parts[0]);
                options.setPassword(parts[1].toCharArray());
            }
        }

        String clientId = UUID.randomUUID().toString();
        MqttClient client = new MqttClient(serverUri, clientId, new MemoryPersistence());

        BoilerPredictiveActivator.printlnDebug("Connecting to MQTT server " + serverUri + " ...");        
        
        client.connect(options);
        
        BoilerPredictiveActivator.printlnDebug("Connected to MQTT server " + serverUri);

        return client;
    }

    public enum OS_ARCH {
        LINUX, WINDOWS, ARM, NONE
    }
    
    /**
     * OSChecker - returns OS type information
     */
    public static final class OSChecker {
        private static String OS = null;

        public static String getName() {
            if (OS == null) {
                OS = System.getProperty("os.arch");
            }
            return OS;
        }
        
        public static OS_ARCH getOSArch() {
            String OS = System.getProperty("os.name").toLowerCase();
            if (OS.indexOf("win") >= 0) {
                return OS_ARCH.WINDOWS;
            } else if (getName().startsWith("arm")) {
                return OS_ARCH.ARM;
            } else if (OS.indexOf("nix") >= 0 || OS.indexOf("nux") >= 0 || OS.indexOf("aix") > 0 ){
                return OS_ARCH.LINUX;
            } else {
                System.out.println("Cannot detect OS/Arch");
                return OS_ARCH.NONE;
            }
        }
    }

    public class ProcessResults {
        int returnCode;
        String outputMessage;
        String errorMessage;
    }

    private ProcessResults executeProcess(List<String> args, boolean holdForProcess, File workingDir) {
        Process databaseProcess = null;
        String result = "";
        ProcessResults processResults = new ProcessResults();
        processResults.outputMessage = "";
        processResults.errorMessage = "";
        InputStream inputStream = null;
        InputStreamReader inputStreamReader = null;
        BufferedReader processInput = null;
        InputStream errorStream = null;
        InputStreamReader errorStreamReader = null;
        BufferedReader processError = null;

        try {
            ProcessBuilder pb = new ProcessBuilder(args);

            /*
             * Overwrite the environment for this process so that it picks up
             * our distributed version of SQL Anywhere
             */
            Map<String, String> envs = pb.environment();
            String keyPath = "PATH";
            String keySQLANY = "SQLANY19";
            String keyJavaHome = "JAVA_HOME";
            String keyLDPath = "LD_LIBRARY_PATH";
            // Check for case sensitivity of the environment variables (Windows definitely)
            Set<String> envKeys = envs.keySet();
            for (String aKey : envKeys) {
                if (aKey.equalsIgnoreCase(keyPath)) {
                    keyPath = aKey;
                }
                if (aKey.equalsIgnoreCase(keySQLANY)) {
                    keySQLANY = aKey;
                }
                if (aKey.equalsIgnoreCase(keyLDPath)) {
                    keyLDPath = aKey;
                }
            }
            //envs.put(keySQLANY, SA_ROOT_PATH.getAbsolutePath());
            String jreHomePathStr = System.getProperty("java.home");
            String jreBinPathStr = System.getProperty("java.home");
            File jreBinPath = null;
            if (jreHomePathStr != null && !jreHomePathStr.isEmpty()) {
                // Add the bin directory for java
                jreBinPath = new File(jreHomePathStr, "bin");
                jreBinPathStr = jreBinPath.getPath() + ((OSArch == OS_ARCH.LINUX || OSArch == OS_ARCH.ARM) ? ":" : ";");
            } else {
                jreHomePathStr = "";
                jreBinPathStr = "";
            }
            /* 
             * DBISQL requires the JRE, not the JDK, so add its environment
             * variable and add the bin directory to the path
             */
            envs.put(keyJavaHome, jreHomePathStr);
            /*
             * Add SQL Anywhere binary to the front of the path
             * Add the JRE path as DBISQL requires it
             * Include the existing path
             */
            //envs.put(keyPath, 
            //        SA_BIN_PATH.getAbsolutePath() + ((OSArch == OS_ARCH.LINUX || OSArch == OS_ARCH.ARM) ? ":" : ";") + 
            //        jreBinPathStr + 
            //        envs.get(keyPath)
            //);
            BoilerPredictiveActivator.printlnDebug(keyPath + ":" + envs.get(keyPath));
            //if ((OSArch == OS_ARCH.LINUX || OSArch == OS_ARCH.ARM)) {
            //    String ldLibPath = envs.get(keyLDPath);
            //    if (ldLibPath == null) {
            //        ldLibPath = "";
            //    } else {
            //        ldLibPath = ":" + ldLibPath;
            //    }
            //    envs.put(keyLDPath, SA_LDLIB_PATH.getAbsolutePath() + ldLibPath);
            //}

            pb.redirectErrorStream(false);
            //log.info("ENV after changes");
            //myKeys = envs.keySet();
            //for (String aKey : myKeys) {
            //    log.info(aKey + " \t==> " + envs.get(aKey));
            //}
            if (workingDir != null && workingDir.exists() && workingDir.isDirectory()) {
                pb.directory(workingDir);
            }
            databaseProcess = pb.start();
        } catch (IOException e) {
            processResults.returnCode = 1;
            processResults.outputMessage = e.getMessage();
            BoilerPredictiveActivator.println("executeProcess IO exception:" + e.getMessage());
        } finally {
            try {
                if (holdForProcess) {
                    databaseProcess.waitFor();

                    inputStream = databaseProcess.getInputStream();
                    inputStreamReader = new InputStreamReader(inputStream);
                    processInput = new BufferedReader(inputStreamReader);

                    errorStream = databaseProcess.getErrorStream();
                    errorStreamReader = new InputStreamReader(errorStream);
                    processError = new BufferedReader(errorStreamReader);

                    StringBuilder builder = new StringBuilder();
                    String output = null;

                    while (processInput.ready() && (output = processInput.readLine()) != null) {
                        builder.append(output);
                        builder.append(System.getProperty("line.separator"));
                    }

                    while (processError.ready() && (output = processError.readLine()) != null) {
                        builder.append(output);
                        builder.append(System.getProperty("line.separator"));
                    }

                    result = result + builder.toString();
                    processResults.outputMessage += ((builder != null) ? builder.toString() : "");

                    // Missing these was causing the mass amounts of open
                    // 'files'
                    databaseProcess.getInputStream().close();
                    databaseProcess.getOutputStream().close();
                    databaseProcess.getErrorStream().close();

                    processResults.returnCode = databaseProcess.exitValue();
                }
            } catch (Exception ioe) {
                // Logger.logException(Logger.WARN, ioe.getMessage(), ioe);
                processResults.outputMessage += ioe.getMessage() + " ";
            } finally {
                if (holdForProcess && databaseProcess != null && databaseProcess.isAlive()) {
                    if (processInput != null) {
                        try {
                            processInput.close();
                        } catch (IOException ioe) {
                        } finally {
                            processInput = null;
                        }
                    }
                    if (inputStreamReader != null) {
                        try {
                            inputStreamReader.close();
                        } catch (IOException ioe) {
                        } finally {
                            inputStreamReader = null;
                        }
                    }
                    if (processError != null) {
                        try {
                            processError.close();
                        } catch (IOException ioe) {
                        } finally {
                            processError = null;
                        }
                    }
                    if (errorStreamReader != null) {
                        try {
                            errorStreamReader.close();
                        } catch (IOException ioe) {
                        } finally {
                            errorStreamReader = null;
                        }
                    }

                    databaseProcess.destroyForcibly();
                }
            }
        }
        return processResults;
    }
}
