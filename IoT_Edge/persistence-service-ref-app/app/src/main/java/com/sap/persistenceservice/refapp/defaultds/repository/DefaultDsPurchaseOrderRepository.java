package com.sap.persistenceservice.refapp.defaultds.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder;

@Repository
public interface DefaultDsPurchaseOrderRepository
    extends JpaRepository<PurchaseOrder, Integer>, JpaSpecificationExecutor<DefaultDsPurchaseOrderRepository> {
}
