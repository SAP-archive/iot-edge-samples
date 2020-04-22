package com.sap.iot.edgeservices.persistence.sample;

import com.sap.iot.edgeservices.persistence.sample.custom.CalculateFFT;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.resource.Post;
import org.restlet.resource.ServerResource;

import java.io.File;
import java.io.IOException;

public class PredictiveController extends ServerResource {

  @Post("json")
  public Integer postConfigData(JsonRepresentation entity) throws JSONException, IOException {

    CalculateFFT calculateFFT = new CalculateFFT(null);
    File rDir = new File("BoilerPredictiveModel", "boiler-R");
    File configProperties = new File("BoilerPredictiveModel", "config.properties");
    calculateFFT.initialize(configProperties, rDir);

    JSONObject object = entity.getJsonObject();
    Integer temperature = (Integer) object.get("temperature");
    Integer pressure = (Integer) object.get("pressure");
    Integer value = calculateFFT.calculatePredictiveValue(temperature, pressure);

    System.out.println("Efficiency value " + value);

    return value;
  }
}
