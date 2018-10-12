package com.sap.edge.analytics;


import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.ProcessBuilder.Redirect;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;

import javax.security.auth.login.LoginException;

import org.apache.commons.lang.StringUtils;

import com.google.gson.JsonIOException;
import com.google.gson.JsonSyntaxException;
import com.sybase.esp.sdk.Callback;
import com.sybase.esp.sdk.Credentials;
import com.sybase.esp.sdk.Project;
import com.sybase.esp.sdk.SDK;
import com.sybase.esp.sdk.SDK.AccessMode;
import com.sybase.esp.sdk.Stream;
import com.sybase.esp.sdk.Stream.Operation;
import com.sybase.esp.sdk.data.MessageReader;
import com.sybase.esp.sdk.data.MessageWriter;
import com.sybase.esp.sdk.data.Publisher;
import com.sybase.esp.sdk.data.RelativeRowWriter;
import com.sybase.esp.sdk.data.RowReader;
import com.sybase.esp.sdk.data.Subscriber;
import com.sybase.esp.sdk.data.SubscriberEvent;
import com.sybase.esp.sdk.data.SubscriberOptions;
import com.sybase.esp.sdk.exception.EntityNotFoundException;
import com.sybase.esp.sdk.exception.ServerErrorException;

public class CclSubscribe {

	private static final SDK s_sdk = SDK.getInstance();
	private static final int WAIT_TIME_60000_MS = 60000;
	//private static Map <String, Object> argMap;	
	private static boolean disconnected = false;
	private static Config cfg;
	
	void doCallbackSubscribe(Config cfg) throws IOException, EntityNotFoundException, InterruptedException, LoginException, ServerErrorException
	{
        // Change credentials to match installation
		Credentials creds = new Credentials.Builder(Credentials.Type.USER_PASSWORD).setUser("user").setPassword("password").create();
		
        //create and connect Project object
		Project project = null;
		
		Integer port = cfg.port;
		
		while (true)
		{
			try
			{
				project = s_sdk.getProject(cfg.host, port, creds);;
        			project.connect(WAIT_TIME_60000_MS);
				break;
            		}
			catch (IOException z)
			{
				System.out.println("Error: " + z.getMessage());
				System.out.println("Retrying connecting...");
				try
				{	
					Thread.sleep(5000);
					
				}
				catch (Exception x)
				{
				}
			}
		}
            
		SubscriberOptions.Builder optBuilder = new SubscriberOptions.Builder();
		optBuilder.setAccessMode(AccessMode.CALLBACK);
		SubscriberOptions options = optBuilder.create();

		String[] streams = null;
		List<String> ds = new ArrayList<String> ();
		ArrayList<Map<String, Object>> streamList = (ArrayList<Map<String, Object>>)cfg.streams;
		if (streamList != null)
		{
			//streams = new String[streamList.size()];
			int i = 0;
			for (Map<String, Object> mm : streamList)
			{
				if (mm.get("persist") != null && ((Boolean)mm.get("persist")))
				{
					System.out.println("Subscribing: " + (String)mm.get("name"));
					ds.add((String)mm.get("name"));
				}
			}
		}
		if (!ds.isEmpty())
		{
			streams = new String[1];
			streams[0] = "osPersist";
			
			Subscriber subscriber = project.createSubscriber(options);
			
			subscriber.subscribeStreams(streams);
			
			Semaphore sem = new Semaphore(0);
			SubscriberHandler handler = new SubscriberHandler(sem);
			subscriber.setCallback(EnumSet.allOf(SubscriberEvent.Type.class), handler);
			subscriber.connect();
			
			// Wait for subscriber to disconnect
			handler.sem.acquire();
		}
	
	}

	/**
	 * @param args
	 * @throws IOException 
	 */
	public static void main(String[] args) throws IOException {
		
		String fileName = "aggr-cnf.json";
		while (true)
		{
			try
			{
				cfg = Config.getConfig(fileName);
				break;
			} catch (FileNotFoundException x) {
				System.out.println("File " + fileName + " is not found!");
				System.out.println("Will retry to ready file in 10 seconds.");
			}
			catch (JsonSyntaxException | JsonIOException x)
			{
				System.out.println("File " + fileName + " is not correctly formatted!");
				System.out.println("Will retry to ready file in 10 seconds.");
			} 
			try
			{
				System.out.println("Type Ctrl+C to quit.");
				Thread.sleep(10000);
			} catch (Exception x) {				
			}
		}
		
		Runtime.getRuntime().addShutdownHook(new Thread() {
	        public void run() {
	            try {
	                //Thread.sleep(200);
	                System.out.println("Stopping the CCL project ...");
	                stopCcl();

	            } catch (Exception e) {
	                // TODO Auto-generated catch block
	                e.printStackTrace();
	            }
	        }
	    });

		String ccl = CclGen.gen(cfg);
		
		if (ccl != null)
		{
			try (PrintWriter out = new PrintWriter("aggr.ccl")) {
				out.println(ccl);
			}
		}
		
		String rules = CclGen.getRulesData(cfg);
		
			
		if (rules != null)
		{
			try (PrintWriter out = new PrintWriter("rules.xml")) {
					out.println(rules);
			}
		}	
		try
		{
			Process p = null;
			if (ccl != null)
			{
				String t = new File(".").getAbsolutePath();
				String compileFile = t.substring(0, t.length()-1) +  "aggr.ccx";
				System.out.println("Compiled output: " + compileFile);
				compile(new File(".").getAbsolutePath() + File.separator + "aggr.ccl", compileFile);
				System.out.println("Starting the Aggregation Service...");
				p = startCcl(compileFile);	
				Thread.sleep(5000);
			}
			if (rules != null)
			{
				s_sdk.start();
				System.out.println("Sending Rules to Aggregation Service...");
				//File f = new File(".");				
				//sendRule(f.getAbsolutePath() + File.separator + "rules.xml");
				doPublishRules();
			}
			if (cfg.isPersistenceAggregationDefined())
			{
				System.out.println("Streaming Analytics is running...");
				subscribe();
			}
			else if (p != null)
			{
				System.out.println("Streaming Analytics is running...");
				p.waitFor();
			}
		}
		catch (Exception x)
		{
			x.printStackTrace();
		}			
	}
	
	private static void subscribe() throws IOException
	{
		do
		{
			disconnected = false;									
			CclSubscribe cclSb = new CclSubscribe();
			cclSb.doConnect();
		} while (disconnected);
	}
	
	public void doConnect() throws IOException {
		try {
			doCallbackSubscribe(cfg);
		}
		catch (java.util.NoSuchElementException y)
		{
			System.out.println("\nThe WINDOW or STREAM configure to subscribe is not found in CCL project: " + y.getMessage() + "\n\n");
		} catch (IOException e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} catch (EntityNotFoundException e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} catch (InterruptedException e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} catch (LoginException e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} catch (ServerErrorException e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} catch (Exception e) {
			System.err.println("!-- " + e.getLocalizedMessage() + "\n");
			e.printStackTrace();
		} finally {
			s_sdk.stop();
		}
	}
	
	public static class SubscriberHandler implements Callback<SubscriberEvent> {
		public Semaphore sem;		
		
		public SubscriberHandler() {
			sem = new Semaphore(0);
		}
		
		public SubscriberHandler(Semaphore sem) {
			this.sem = sem;
		}
		
		public String getName() {
			return null;
		}

		public void processEvent(SubscriberEvent event) {
			switch (event.getType()) {
			case SUBSCRIBED:
				System.out.println("<subscribed/>");
				break;
			case SYNC_START:
				System.out.println("<sync-start/>");
				break;
			case SYNC_END:
				System.out.println("<sync-end/>");
				break;
			case CLOSED:
				System.out.println("<closed/>");
				break;
			case CONNECTED:
				System.out.println("<connected/>");
				break;
			case STREAM_EXIT:
				System.out.println("<stream-exit/>");
				break;
			case DATA:
				MessageReader reader = event.getMessageReader();
				String str = reader.getStream().getName();	

				while ( reader.hasNextRow() ) {
					RowReader row = reader.nextRowReader();
					AggregatedTuple tuple = new AggregatedTuple();
					if (str != null)
					{
						str = str.toUpperCase();
					}
					
					for (int j = 0; j < row.getSchema().getColumnCount(); ++j) 
					{
						 if ( row.isNull(j))
							 continue;

						 switch ( row.getSchema().getColumnTypes()[j]) 
						 {
							 case INTEGER:
								 tuple.setMeasure(new Double(row.getInteger(j)));
								 break;
								 
							 case LONG:
								 tuple.setMeasure(new Double(row.getLong(j)));
								 break;
								 
							 case STRING:
								 if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("SensorId"))
								 {
									 tuple.setSensorId(row.getString(j));
								 }
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("SensorTag"))
								 {
									 tuple.setSensorTag(row.getString(j));
								 }
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("SENSORPROFILEID"))
								 {
									 tuple.setProfileId(row.getString(j));
									 String p = row.getString(j);
									 //System.out.println("p=" + p + " cnt=" + StringUtils.countMatches(p, "_"));
									 if (StringUtils.countMatches(p, "_") == 3)
									 {										 
										 //Cap_0_1_Temperature
										 int ind = p.lastIndexOf("_");
										 if (ind > 0 && ind+1 < p.length())
										 {
											 p = p.substring(ind+1);
										 }
									 }
									 else if (StringUtils.countMatches(p, "_") == 2)
									 {										 
										//Temperature_0_1
										 int ind = p.indexOf("_");
										 if (ind > 0 && ind < p.length())
										 {
											 p = p.substring(0, ind);
										 }
									 }
									 tuple.setPropertyName(p);
								 }
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("DEVICEID"))
								 {
									 tuple.setDeviceId(row.getString(j));
								 }
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("DeviceTag"))
								 {
									 tuple.setDeviceTag(row.getString(j));
								 }
								 /*
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("PropertyName"))
								 {
									 tuple.setPropertyName(row.getString(j));
								 }*/
								 
								 else if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("AggregationType"))
								 {
									 tuple.setAggregationType(row.getString(j));
									 if (row.getString(j) != null)
									 {
										 	String tm = getConfigAggregationTime(row.getString(j));
											if (null != tm && tm.contains(" "))
											{
												//System.out.println("tm=" + tm);
												tm = tm.replaceAll(" ", "");
												tm = tm.toUpperCase();
											}
											//System.out.println("tm=" + tm);
											tuple.setAggregationTime(tm);
									 }
								 }
								 
								 break;
								 
							 case SECONDDATE:
								 //System.out.println("date=" + row.getSecondDate(j));
								 if (row.getSchema().getColumnNames()[j].equalsIgnoreCase("DateCreated"))
								 {
									 tuple.setProcessedTime(row.getSecondDate(j));
								 }
								 break;
							 
							 case DOUBLE:
								 tuple.setMeasure(row.getDouble(j));
								 break;
							
							 default:
								//System.out.println(str + ": " + row.toXmlString(str));
								break;
						 }					
					}
					//tuple.printMe();
					tuple.writeCsv();
				}
				break;
				
			case DISCONNECTED:
				System.out.println("<disconnected/>");
				sem.release();
				disconnected = true;
				try
				{					
					Thread.sleep(5000);
				}
				catch (Exception z)
				{					
				}
				break;
			case ERROR:
				System.out.println("<error msg=\"" + event.getError() + "\" />");
				break;
			default:
				System.out.println(event);
				break;
			}
		}
				
	}
	
	private static String getConfigAggregationTime(String aggr)
	{
		ArrayList<Map<String, Object>> streamList = (ArrayList<Map<String, Object>>)cfg.streams;
		if (streamList != null)
		{
			for (Map<String, Object> mm : streamList)
			{
				if ( (String)mm.get("type") != null && ((String)mm.get("type")).equalsIgnoreCase(aggr))
				{
					return (String)mm.get("time");
				}
			}
		}
		return null;
	}
	
	//streamingproject --ccx C:\EdgeServices\edgeservices\esp\ESP-5_1\CPK.ccx --command-port 9999 --host localhost
	private static Process startCcl(String ccxFile) throws Exception
	{
		String hm = System.getenv("STREAMING_HOME");
		
		Integer port = cfg.port;
		/*if (map.get("port") instanceof Double)
		{
			port =  ((Double) map.get("port")).intValue();
		}
		else
		{
			port = (Integer)map.get("port");
		}*/
		
		String streamingproject = "streamingproject";
		if (System.getProperty("os.name").startsWith("Windows"))
		{
			streamingproject = "streamingproject.exe";			
		}
		streamingproject = hm + File.separator + "bin" + File.separator + streamingproject;
		 
		 //System.out.println("STREAMING_HOME: " + hm);
		 ProcessBuilder pb = new ProcessBuilder(streamingproject,  "--ccx",  ccxFile, "--command-port", ""+port, "--host",  ""+cfg.host);
		 //System.out.println("Command: " + streamingproject + " --ccx " + ccxFile + " --command-port " + port + " --host " + ""+cfg.host);
		 Map<String, String> env = pb.environment();
		 env.put("STREAMING_HOME", hm);
		 //env.remove("OTHERVAR");
		 //env.put("VAR2", env.get("VAR1") + "suffix");
		 pb.directory(new File(hm + File.separator + "bin"));
		 File log = new File("aggr-ccl.log");
		 pb.redirectErrorStream(true);
		 pb.redirectOutput(Redirect.appendTo(log));
		 Process p = pb.start();
		 assert pb.redirectInput() == Redirect.PIPE;
		 assert pb.redirectOutput().file() == log;
		 assert p.getInputStream().read() == -1;
		 
		 return p;
	}

	//type input.xml   | bin\streamingconvert.exe  -p localhost:9999    | bin\streamingupload.exe  -p localhost:9999
	private static void sendRule(String ruleFileName) throws Exception
	{
		String hm = System.getenv("STREAMING_HOME");
		
		Integer port = cfg.port;
		ProcessBuilder pb = null;
		String inp = hm;
		String streamingcnv = "streamingconvert";
		String streamingupl = "streamingupload";
		if (System.getProperty("os.name").startsWith("Windows"))
		{
			streamingcnv = "streamingconvert.exe";	
			inp = "type " + ruleFileName + " | " + hm;
			streamingupl = "streamingupload.exe";
			streamingcnv = inp + File.separator + "bin" + File.separator + streamingcnv;
			streamingupl = hm + File.separator + "bin" + File.separator + streamingupl;
			
			pb = new ProcessBuilder(streamingcnv,  "-p",  cfg.host + ":" + cfg.port + " | ", 
					streamingupl,  "-p ",  cfg.host + ":" + cfg.port);
			
		}
		else
		{
			inp = "cat " + ruleFileName + " | " + hm;
			streamingcnv = inp + File.separator + "bin" + File.separator + streamingcnv;
			streamingupl = hm + File.separator + "bin" + File.separator + streamingupl;
			pb = new ProcessBuilder(streamingcnv,  "-p ",  cfg.host + ":" + cfg.port, " | ", streamingupl,  "-p ",  cfg.host + ":" + cfg.port);
		}
				
		 //System.out.println("command: " + Arrays.toString(pb.command().toArray()));
		 
		 Map<String, String> env = pb.environment();
		 env.put("STREAMING_HOME", hm);
		 pb.directory(new File(hm + File.separator + "bin"));
		 File log = new File("aggr-ccl.log");
		 pb.redirectErrorStream(true);
		 pb.redirectOutput(Redirect.appendTo(log));
		 Process p = pb.start();
		 assert pb.redirectInput() == Redirect.PIPE;
		 assert pb.redirectOutput().file() == log;
		 assert p.getInputStream().read() == -1;
	}
	
	//./streamingprojectclient [-c username: password] -p <hostname of streaming lite>:<command port of streaming lite> stop
	private static void stopCcl() throws Exception
	{
		String hm = System.getenv("STREAMING_HOME");
		
		Integer port = cfg.port;
		
		String streamingprojectclient = "streamingprojectclient";
		if (System.getProperty("os.name").startsWith("Windows"))
		{
			streamingprojectclient = "streamingprojectclient.exe";			
		}
		streamingprojectclient = hm + File.separator + "bin" + File.separator + streamingprojectclient;
		 
		 //System.out.println("STREAMING_HOME: " + hm);
		 ProcessBuilder pb = new ProcessBuilder(streamingprojectclient,  "-p", ""+cfg.host + ":" + port, "stop");
		 
		 Map<String, String> env = pb.environment();
		 env.put("STREAMING_HOME", hm);

		 pb.directory(new File(hm + File.separator + "bin"));
		 File log = new File("aggr-ccl.log");
		 pb.redirectErrorStream(true);
		 pb.redirectOutput(Redirect.appendTo(log));
		 Process p = pb.start();
		 assert pb.redirectInput() == Redirect.PIPE;
		 assert pb.redirectOutput().file() == log;
		 assert p.getInputStream().read() == -1;
	}

	
	private static void compile(String cclFile, String ccxFile) throws Exception
	{
		String hm = System.getenv("STREAMING_HOME");
		
		Integer port = 0;		
		String streamingcompiler = "streamingcompiler";
		if (System.getProperty("os.name").startsWith("Windows"))
		{
			streamingcompiler = "streamingcompiler.exe";			
		}
		streamingcompiler = hm + File.separator + "bin" + File.separator + streamingcompiler;
		 
		 //System.out.println("STREAMING_HOME: " + hm + "\n Command: " + streamingcompiler);
		 ProcessBuilder pb = new ProcessBuilder(streamingcompiler, "-i", cclFile, "-o", ccxFile);
		 Map<String, String> env = pb.environment();
		 env.put("STREAMING_HOME", hm);
		 //env.remove("OTHERVAR");
		 //env.put("VAR2", env.get("VAR1") + "suffix");
		 pb.directory(new File(hm + File.separator + "bin"));
		 File log = new File("aggr-ccl-compile.log");
		 pb.redirectErrorStream(true);
		 pb.redirectOutput(Redirect.appendTo(log));
		 Process p = pb.start();
		 assert pb.redirectInput() == Redirect.PIPE;
		 assert pb.redirectOutput().file() == log;
		 assert p.getInputStream().read() == -1;
	}
	
	public static void doPublishRules() throws IOException, EntityNotFoundException, LoginException, ServerErrorException
	{
		Credentials creds = new Credentials.Builder(Credentials.Type.USER_PASSWORD).setUser("user").setPassword("password").create();
		
		Integer port = cfg.port;
		Project project = s_sdk.getProject(cfg.host, port, creds);;
		project.connect(WAIT_TIME_60000_MS);
		
		Publisher publisher = project.createPublisher();

		String streamName = "ProfileRules";
		
		int totalRecs = 0;

		Stream stream = project.getStream(streamName);
		
		publisher.connect();
		
		MessageWriter message = publisher.getMessageWriterCached(stream);
		RelativeRowWriter row = message.getRelativeRowWriter();

		long start = System.currentTimeMillis();
		
		//
		// Publish data - one row at a time
		// Use startEnvelope() or startTransaction() for higher throughput
		//
		for (Map<String, Object> r : cfg.rules)
		{	
		//for(int rowNum = 1; rowNum <= totalRecs; rowNum++) {
			if (r.get("aggr") != null)
			{
				row.startRow();
				row.setOperation(Operation.INSERT);
				
				// column 1 an STRING
				System.out.println(r.get("aggr") + ", " + r.get("profileId") + ", " + (String)r.get("ruleId"));
				row.setString((String)r.get("aggr"));
				// column 2 a STRING
				row.setString((String)r.get("profileId"));
				// column 3 a STRING
				row.setString((String)r.get("ruleId"));
				
				row.endRow();
				
				publisher.publish(message, true);
				totalRecs++;
			}
		}
		publisher.commit();
		long end = System.currentTimeMillis();
		System.out.println("--- Rules published [records=" + totalRecs + ", milliseconds="+ (end-start) + ", throughput=" + totalRecs * 1000.0/(end-start) + "]");
	}	
}
