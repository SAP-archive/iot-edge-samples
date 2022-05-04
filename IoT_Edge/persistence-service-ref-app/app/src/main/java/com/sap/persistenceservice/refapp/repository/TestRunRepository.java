package com.sap.persistenceservice.refapp.repository;

import com.sap.persistenceservice.refapp.entity.TestKey;
import com.sap.persistenceservice.refapp.entity.TestRunConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TestRunRepository
    extends JpaRepository<TestRunConfig, TestKey>, JpaSpecificationExecutor<TestRunConfig> {

}