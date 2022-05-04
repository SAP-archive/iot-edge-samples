package com.sap.persistenceservice.refapp.controller;

import com.sap.persistenceservice.refapp.bean.TestRunConfigResp;
import com.sap.persistenceservice.refapp.bean.TestSet;
import com.sap.persistenceservice.refapp.entity.TestRunConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.service.LoadTestRunnerService;
import com.sap.persistenceservice.refapp.utils.MessageUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@Tag(name = "Test Runner Controller")
public class TestRunnerController {

    private static final Logger log = LoggerFactory.getLogger(TestRunnerController.class);

    @Autowired
    private LoadTestRunnerService testRunnerService;

    @PostMapping(value = "/loadTestRunner")
    @Operation(description = "Execute a set of tests")
    public List<TestRunConfigResp> startLoadTest(@RequestBody TestSet request)
        throws PayloadValidationException {
        log.info("Beginning persistence test execution");

        List<TestRunConfig> configList;
        try {
            configList = testRunnerService.initiateTestSet(request);
        } catch (Exception e) {
            log.error("Error while creating load test tasks: ", e);
            throw e;
        }

        List<TestRunConfigResp> response = new ArrayList<>();
        configList.forEach((n) -> response.add(new TestRunConfigResp(n)));

        return response;
    }

    @PostMapping(value = "/loadTestRunner/batch")
    @Operation(description = "Execute multiple sets of tests in sequence")
    public List<TestRunConfigResp> startLoadTest(@RequestBody List<TestSet> request)
        throws PayloadValidationException {
        log.info("Beginning persistence test execution");

        List<TestRunConfig> configList;
        try {
            configList = testRunnerService.initiateTestSet(request);
        } catch (Exception e) {
            log.error("Error while creating load test tasks: ", e);
            throw e;
        }

        List<TestRunConfigResp> response = new ArrayList<>();
        configList.forEach((n) -> response.add(new TestRunConfigResp(n)));

        return response;
    }

    @GetMapping(value = "/loadTestRunner/results")
    @Operation(description = "Returns test results for all runs.")
    public List<TestRunConfig> getResults() {
        return testRunnerService.getResults();
    }

    @GetMapping(value = "/loadTestRunner/results/{input}")
    @Operation(description = "Returns test results matching the name (user-provided) or id (generated).")
    public List<TestRunConfig> getResultsByNameOrId(@PathVariable("input") String input) {
        return testRunnerService.getResultsByNameOrId(input);
    }

    @GetMapping(value = "/loadTestRunner/isRunning")
    @Operation(description = "Returns whether a test is currently running or not")
    public boolean getIsRunning() {
        return MessageUtil.getInstance().getMessageCounter() != 0L;
    }
}
