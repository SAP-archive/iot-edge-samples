package com.sap.edge.analytics;

import java.io.File;
import java.io.FileWriter;
import java.util.Date;

public class AggregatedTuple 
{
		private String deviceId;
		private String deviceTag;
		private String sensorId;
		private String sensorTag;
		private String profileId;
		private Double measure;
		private Date processedTime;
		private String propertyName;
		private String AggregationType;
		private String AggregationTime;
		
		public static final String header="AggregationType,processedTime,measure,profileId,deviceId,deviceTag,sensorId,sensorTag,propertyName,AggregationTime";
		public static final String fileName = "output-aggregates.csv";
		public static FileWriter writer = null;
		static
		{
			try
			{
				boolean exists = false;
				File f = new File(fileName);
				if (f.exists())
					exists = true;
				else
				{
					f.createNewFile();
				}
				writer = new FileWriter(f);
				if (!exists || f.length() == 0)
				{
					writer.append(header);
				}
			}
			catch (Exception x)
			{
				x.printStackTrace();
			}
		}
		
		public String getDeviceId() {
			return deviceId;
		}

		public void setDeviceId(String deviceId) {
			this.deviceId = deviceId;
		}

		public String getDeviceTag() {
			return deviceTag;
		}

		public void setDeviceTag(String deviceTag) {
			this.deviceTag = deviceTag;
		}

		public String getSensorId() {
			return sensorId;
		}

		public void setSensorId(String sensorId) {
			this.sensorId = sensorId;
		}

		public String getSensorTag() {
			return sensorTag;
		}

		public void setSensorTag(String sensorTag) {
			this.sensorTag = sensorTag;
		}

		public String getProfileId() {
			return profileId;
		}

		public void setProfileId(String profileId) {
			this.profileId = profileId;
		}

		public Double getMeasure() {
			return measure;
		}

		public void setMeasure(Double measure) {
			this.measure = measure;
		}

		public Date getProcessedTime() {
			return processedTime;
		}

		public void setProcessedTime(Date processedTime) {
			this.processedTime = processedTime;
		}

		public String getPropertyName() {
			return propertyName;
		}

		public void setPropertyName(String propertyName) {
			this.propertyName = propertyName;
		}

		public String getAggregationType() {
			return AggregationType;
		}

		public void setAggregationType(String aggregationType) {
			AggregationType = aggregationType;
		}

		public void printMe()
		{
			System.out.println(AggregationType + " | " + processedTime + " | " + measure + " | " + profileId + " | " + deviceId + " | " + deviceTag + " | " + sensorId + " | " + sensorTag+ " | " + propertyName + " | " + AggregationTime);
		}
		
		public String getCsvRow()
		{
			return getCsvString(AggregationType) + "," + processedTime + "," + measure + "," + getCsvString(profileId) + "," + getCsvString(deviceId) 
					+ "," + getCsvString(deviceTag) + "," + getCsvString(sensorId) + "," + getCsvString(sensorTag) + "," + getCsvString(propertyName) + "," + getCsvString(AggregationTime) + "\n";
		}

		public String getAggregationTime() {
			return AggregationTime;
		}

		public void setAggregationTime(String aggregationTime) {
			AggregationTime = aggregationTime;
		}
		
		private String getCsvString(String s)
		{
			if (s == null)
			{
				return "";
			}
			if (s.contains(",") || s.contains("\n") || s.contains("\""))
			{
				s = "\"" + s + "\"";
			}			
			return s;
		}

		public void writeCsv()
		{
			try
			{
				writer.append(getCsvRow());
				writer.flush();
			}
			catch (Exception x)
			{
				x.printStackTrace();
			}
		}
}
