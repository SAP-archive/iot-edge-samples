package com.sap.edge.analytics;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonIOException;
import com.google.gson.JsonSyntaxException;

public class Config 
{
	public String host = "localhost";
	public Integer port = 9090;
	public Integer reconnect_interval = 5;
	public String ccx;
	
	ArrayList<Map<String, Object>> streams = new ArrayList<Map<String, Object>>();
	ArrayList<Map<String, Object>> rules = new ArrayList<Map<String, Object>>();
	
	public static Config getConfig(String fileName) throws JsonSyntaxException, JsonIOException, FileNotFoundException
	{
		Config ac = new Config();
		try {
			 ac = new Gson().fromJson(new FileReader(fileName), Config.class);
			//System.out.println(new Gson().toJson(ac));
			
		} catch (JsonSyntaxException | JsonIOException | FileNotFoundException e) {
			
			e.printStackTrace();
			throw e;
		}
		return ac;
	}
	
	public boolean isPersistenceAggregationDefined()
	{
		for (Map<String, Object> m: streams)
		{
			if (m.get("persist") != null && ((Boolean)m.get("persist")))
			{
				return true;
			}
		}
		return false;
	}
	
	public Config()
	{		
	}
	
	
	public static void main(String[] a)
	{
		Config c = new Config();
		
		c.host= "localhost";
		c.port = 9090;		
		c.ccx = "aggr.ccx";
		c.reconnect_interval = 5;
			
		Map <String, Object> w1 = new HashMap<String, Object>();
		w1.put("name", "AVGSTREAM");
		w1.put("type", "AVG");
		w1.put("time", "30SEC");
		w1.put("persist", true);
		c.streams.add(w1);
		
		Map <String, Object> w2 = new HashMap<String, Object>();
		w2.put("name", "SUMSTREAM");
		w2.put("type", "SUM");
		w2.put("time", "30SEC");		
		c.streams.add(w2);
		
		Map <String, Object> w3 = new HashMap<String, Object>();
		w3.put("name", "COUNTSTREAM");
		w3.put("type", "COUNT");
		w3.put("time", "30SEC");		
		c.streams.add(w3);
		
		Map <String, Object> w4 = new HashMap<String, Object>();
		w4.put("name", "MINSTREAM");
		w4.put("type", "MIN");
		w4.put("time", "30SEC");		
		c.streams.add(w4);
		
		Map <String, Object> w5 = new HashMap<String, Object>();
		w5.put("name", "MAXSTREAM");
		w5.put("type", "MAX");
		w5.put("time", "30SEC");		
		c.streams.add(w5);
		
		Map <String, Object> w6 = new HashMap<String, Object>();
		w6.put("name", "MEDIANSTREAM");
		w6.put("type", "MEDIAN");
		w6.put("time", "30SEC");		
		c.streams.add(w6);
		
		Map <String, Object> w7 = new HashMap<String, Object>();
		w7.put("name", "SDDEVSTREAM");
		w7.put("type", "SDDEV");
		w7.put("time", "30SEC");		
		c.streams.add(w7);
		
		Map <String, Object> w8 = new HashMap<String, Object>();
		w8.put("name", "COUNTDISTICTSTREAM");
		w8.put("type", "COUNTDISTICT");
		w8.put("time", "30SEC");		
		c.streams.add(w8);
		
		Map <String, Object> w9 = new HashMap<String, Object>();
		w9.put("name", "WEIGHTEDAVGSTREAM");
		w9.put("type", "WEIGHTEDAVG");
		w9.put("time", "30SEC");		
		c.streams.add(w9);
		
		Map <String, Object> w10 = new HashMap<String, Object>();
		w10.put("name", "FIRSTVALUESTREAM");
		w10.put("type", "FIRSTVALUE");
		w10.put("time", "30SEC");		
		c.streams.add(w10);
		
		Map <String, Object> w11 = new HashMap<String, Object>();
		w11.put("name", "LASTVALUESTREAM");
		w11.put("type", "LASTVALUE");
		w11.put("time", "30SEC");		
		c.streams.add(w11);
		
		Map <String, Object> wr = new HashMap<String, Object>();
		wr.put("name", "AVGSTemperature");
		wr.put("property", "Temperature");
		wr.put("type", "streaming");
		wr.put("stream", "AVGSTREAM");
		c.rules.add(wr);
		
		System.out.println(new Gson().toJson(c));
		
		try {
			//Config cc = new Gson().fromJson(new FileReader("/personal/eclipse/CclSubscriber/aggr-cnf.json"), Config.class);
			Config cc = new Gson().fromJson(new FileReader("aggr-cnf.json"), Config.class);
			System.out.println(new Gson().toJson(cc));
			
		} catch (JsonSyntaxException | JsonIOException | FileNotFoundException e) {
			
			e.printStackTrace();
		}
	}
}
