package com.sap.persistenceservice.refapp.controller;

import java.util.List;

import javax.persistence.EntityNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.bean.PurchaseOrderInput;
import com.sap.persistenceservice.refapp.entity.PurchaseOrder;
import com.sap.persistenceservice.refapp.service.PurchaseOrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Purchase Orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderController.class);

    @Autowired
    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping(value = "/purchaseOrder")
    @Operation(description = "Returns all purchase orders")
    public List<PurchaseOrder> getPurchaseOrder() {
        log.info("Request - getting all purchase orders");
        return purchaseOrderService.getAllPurchaseOrders();
    }

    @GetMapping(value = "/purchaseOrder/{id}")
    @Operation(description = "Returns single purchase order details")
    public PurchaseOrder getPurchaseOrderById(@PathVariable("id") int id) {
        log.info("Request - getting purchase with id '{}", id);

        PurchaseOrder purchaseOrder = purchaseOrderService.getPurchaseOrder(id);
        if (purchaseOrder == null) {
            throw new EntityNotFoundException("Purchare order with id " + id + " not found");
        }
        return purchaseOrder;
    }

    @PostMapping(value = "/purchaseOrder")
    @Operation(description = "Post a purchase order")
    public PurchaseOrder postPurchaseOrder(@RequestBody PurchaseOrderInput request) {
        log.info("Request - creating a purchase order");
        return purchaseOrderService.createPurchaseOrder(request);
    }
}
