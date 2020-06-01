package com.sap.iot.edgeservices.persistence.sample;

import org.restlet.Application;
import org.restlet.Restlet;
import org.restlet.resource.Directory;
import org.restlet.routing.Router;

public class Route extends Application {

  @Override
  public synchronized Restlet createInboundRoot() {

    Router router = new Router(getContext());
    router.attach("/predictive", PredictiveController.class);

    Directory directory = new Directory(getContext(), "clap:///");
    directory.setDeeplyAccessible(true);
    router.attach("/web", directory);

    return router;
  }
}
