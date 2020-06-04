/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iotservice.extension;

import static com.sap.iotservice.gateway.edge.api.EdgeApiConstants.EDGE_API_BASE_PATH_TENANT;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iotservice.gateway.netty.interfaces.NettyService;
import com.sap.iotservices.gateway.extension.IEdgeApiExtension;
import com.sap.iotservices.topology.edge.api.beans.SensorBean;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@Component
@Tag(name = "ExtendedOperations")
@Path(EDGE_API_BASE_PATH_TENANT + "/extended")
public class InteroperabilityModuleActivator
implements NettyService {
	private IEdgeApiExtension edgeApiExtension;

	@Reference(cardinality = ReferenceCardinality.MANDATORY, policy = ReferencePolicy.DYNAMIC)
	public void setEdgeApiExtension(IEdgeApiExtension edgeApiExtension) {
		this.edgeApiExtension = edgeApiExtension;
	}

	void unsetEdgeApiExtension(IEdgeApiExtension edgeApiExtension) {
		this.edgeApiExtension = null;
	}

	@GET
	@Path("uptime")
	@Produces(MediaType.APPLICATION_JSON)
	@Operation(summary = "Returns the UPTIME", description = "The endpoint gives the uptime of the Edge Platform", responses = {
		@ApiResponse(responseCode = "200", description = "Successfully returned time.", content = @Content(schema = @Schema(implementation = Long.class))),
		@ApiResponse(responseCode = "400", description = "Malformed HTTP request", content = @Content(schema = @Schema(implementation = BaseHttpResponse.class))) })
	public long getUptime(
		@Parameter(description = "TenantId", required = true) @PathParam("TenantId") String tenantId) {

		return edgeApiExtension.getUptime();
	}

	@GET
	@Path("downtime")
	@Produces(MediaType.APPLICATION_JSON)
	@Operation(summary = "Returns the DOWNTIME", description = "The endpoint returns the downtime of the system, computed from the startup of the system", responses = {
		@ApiResponse(responseCode = "200", description = "Successfully returned time.", content = @Content(schema = @Schema(implementation = Long.class))),
		@ApiResponse(responseCode = "400", description = "Malformed HTTP request", content = @Content(schema = @Schema(implementation = BaseHttpResponse.class))) })
	public long getDowntime(
		@Parameter(description = "TenantId", required = true) @PathParam("tenantId") String tenantId) {

		return edgeApiExtension.getDowntime();
	}

	@GET
	@Path("getnoisepower/{signal}/{variance}")
	@Produces(MediaType.APPLICATION_JSON)
	@Operation(summary = "Compute the quantity of noise power contained in a signal", description = "The endpoint sends a new configuration for the OSGI bundle(s).", responses = {
		@ApiResponse(responseCode = "200", description = "Successfully returned power.", content = @Content(array = @ArraySchema(schema = @Schema(implementation = SensorBean.class)))),
		@ApiResponse(responseCode = "400", description = "Malformed HTTP request", content = @Content(schema = @Schema(implementation = BaseHttpResponse.class))) })
	public float getNoisePower(
		@Parameter(description = "TenantId", required = true) @PathParam("tenantId") String tenantId,
	@Parameter(description = "Signal", required = true) @PathParam("signal") float signal,
	@Parameter(description = "Variance", required = true) @PathParam("variance") float variance) {

		return edgeApiExtension.getNoisePower(signal, variance);
	}

}
