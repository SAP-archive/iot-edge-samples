package com.sap.persistenceservice.refapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.sap.persistenceservice.refapp.entity.Metric;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Integer>, JpaSpecificationExecutor<MetricRepository> {

    public List<Metric> findByTestName(String testName);

}
