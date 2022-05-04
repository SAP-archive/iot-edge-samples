package com.sap.persistenceservice.refapp.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.sap.persistenceservice.refapp.bean.PurchaseOrderInput;
import com.sap.persistenceservice.refapp.defaultds.repository.DefaultDsPurchaseOrderRepository;
import com.sap.persistenceservice.refapp.entity.PurchaseOrder;
import com.sap.persistenceservice.refapp.repository.PurchaseOrderRepository;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    private final DefaultDsPurchaseOrderRepository defaultDsPurchaseOrderRepository;

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderService.class);

    @Autowired
    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
        @Nullable DefaultDsPurchaseOrderRepository defaultDsPurchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.defaultDsPurchaseOrderRepository = defaultDsPurchaseOrderRepository;
    }

    public List<com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder> getAllDefaultPurchaseOrders() {
        return defaultDsPurchaseOrderRepository.findAll();
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder getOderById(int id) {
        Optional<com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder> optionalPurchaseOrder = defaultDsPurchaseOrderRepository
            .findById(id);
        if (optionalPurchaseOrder.isPresent()) {
            return optionalPurchaseOrder.get();
        }
        log.debug("Purchase order with id {} not found", id);
        return null;
    }

    public PurchaseOrder getPurchaseOrder(int id) {

        Optional<PurchaseOrder> optionalPurchaseOrder = purchaseOrderRepository.findById(id);
        if (optionalPurchaseOrder.isPresent()) {
            return optionalPurchaseOrder.get();
        }
        log.debug("Purchase order with id {} not found", id);
        return null;
    }

    public com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder createDefaultPurchaseOrder(
        PurchaseOrderInput purchaseOrderInput) {

        com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder purchaseOrder = new com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder(
            purchaseOrderInput.getId(), purchaseOrderInput.getName(),
            purchaseOrderInput.getQuantity());
        return defaultDsPurchaseOrderRepository.save(purchaseOrder);
    }

    public PurchaseOrder createPurchaseOrder(PurchaseOrderInput purchaseOrderInput) {
        PurchaseOrder purchaseOrder = new PurchaseOrder(purchaseOrderInput.getId(), purchaseOrderInput.getName(),
            purchaseOrderInput.getQuantity());
        return purchaseOrderRepository.save(purchaseOrder);
    }

}
