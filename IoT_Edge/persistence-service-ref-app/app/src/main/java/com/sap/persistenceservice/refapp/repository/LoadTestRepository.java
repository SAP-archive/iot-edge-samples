package com.sap.persistenceservice.refapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.sap.persistenceservice.refapp.entity.LoadTestConfig;

@Repository
public interface LoadTestRepository
    extends JpaRepository<LoadTestConfig, String>, JpaSpecificationExecutor<LoadTestRepository> {
    
}
