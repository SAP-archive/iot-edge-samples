package com.sap.persistenceservice.refapp.controller;

import java.util.List;

import javax.persistence.EntityNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.bean.PurchaseOrderInput;
import com.sap.persistenceservice.refapp.service.PurchaseOrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@ConditionalOnProperty(name = "CUSTOM_EXTENSION", havingValue = "false")
@Tag(name = "Purchase Orders for Default Datasource")
public class DefaultPurchaseOrderController {

    private static final Logger log = LoggerFactory.getLogger(DefaultPurchaseOrderController.class);

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping(value = "/defaultds/purchaseOrder")
    @Operation(description = "Returns all purchase orders from default datasource")
    public List<com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder> getPurchaseOrder() {
        log.info("Request - getting all purchase orders");
        return purchaseOrderService.getAllDefaultPurchaseOrders();
    }

    @GetMapping(value = "/defaultds/purchaseOrder/{id}")
    @Operation(description = "Returns single purchase order details")
    public com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder getPurchaseOrderById(
        @PathVariable("id") int id) {
        log.info("Request - getting purchase with id '{}", id);

        com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder purchaseOrder = purchaseOrderService
            .getOderById(id);
        if (purchaseOrder == null) {
            throw new EntityNotFoundException("Purchare order with id " + id + " not found");
        }
        return purchaseOrder;
    }

    @PostMapping(value = "/defaultds/purchaseOrder")
    @Operation(description = "Post a purchase order")
    public com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder postPurchaseOrder(
        @RequestBody PurchaseOrderInput request) {
        log.info("Request - creating a purchase order");
        return purchaseOrderService.createDefaultPurchaseOrder(request);
    }

}
