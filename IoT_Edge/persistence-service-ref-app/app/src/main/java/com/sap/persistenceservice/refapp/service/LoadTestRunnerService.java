package com.sap.persistenceservice.refapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.TestRun;
import com.sap.persistenceservice.refapp.bean.TestSet;
import com.sap.persistenceservice.refapp.entity.TestRunConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.repository.TestRunRepository;
import com.sap.persistenceservice.refapp.task.LoadTestTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class LoadTestRunnerService {

    private static final Logger log = LoggerFactory.getLogger(LoadTestRunnerService.class);

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @Autowired
    private IotModelService iotModelService;

    @Autowired
    private TestRunRepository testRunRepository;

    private final ExecutorService sequentialExecutor = Executors.newSingleThreadExecutor();

    public List<TestRunConfig> initiateTestSet(TestSet request)
            throws PayloadValidationException {

        // Treat single and batch as the same process; single is effectively just a batch of 1
        List<TestSet> tests = new ArrayList<>();
        tests.add(request);
        return initiateTestSet(tests);
    }

    public List<TestRunConfig> initiateTestSet(List<TestSet> request)
            throws PayloadValidationException {

        // Flatten the nested tests into a single list of TestRunConfig objects
        // Grouping by "test set" is maintained by generated ID and does not need to be part of the data structure
        List<TestRunConfig> configList = new ArrayList<>();
        request.forEach((n) -> configList.addAll(mapTestRunConfigs(n)));

        List<LoadTestTask> taskList = getTestRunTasks(configList);

        log.info("Enqueueing {} load test tasks.", taskList.size());
        enqueueLoadTestTasks(taskList);

        return configList;
    }

    private List<TestRunConfig> mapTestRunConfigs(TestSet request) {
        List<TestRunConfig> configList = new ArrayList<>();
        String testSetId;
        List<TestRun> testList;
        TestRun test;

        for (int i = 0; i < request.getIterations(); i++) {
            testSetId = UUID.randomUUID().toString();
            testList = request.getTests();

            log.info("Preparing set of {} tests identified by {} with name {}",
                    testList.size(), testSetId, request.getTestSetName());

            for (int t = 0; t < testList.size(); t++) {
                test = testList.get(t);
                configList.add(new TestRunConfig(testSetId, t,
                        request.getTestSetName(), test.getMeasuresPerSecond(),
                        test.getDurationSeconds(), request.getConnectionUrl(),
                        request.getDeviceAlternateId(), request.getNoOfThreads(), request.getPollingFreqMillis()));
            }
        }

        return configList;
    }

    private List<LoadTestTask> getTestRunTasks(List<TestRunConfig> configList) {
        List<LoadTestTask> taskList = new ArrayList<>();
        TestRunConfig testConfig;

        for (int i = 0; i < configList.size(); i++) {
            testConfig = configList.get(i);
            log.debug("Adding task for test {}: {} ({} measures per second for {} seconds on {} threads)",
                    i, testConfig.getTestName(), testConfig.getMeasuresPerSecond(),
                    testConfig.getDurationSeconds(), testConfig.getNoOfThreads());

            taskList.add(new LoadTestTask(testConfig,
                    objectMapper, connectionPoolManager, iotModelService, testRunRepository));
        }

        return taskList;
    }

    private void enqueueLoadTestTasks(List<LoadTestTask> taskList) {
        log.debug("Enqueueing {} test execution tasks",
                taskList.size());
        for (LoadTestTask loadTestTask : taskList) {
            // enqueue all tasks to be run sequentially
            sequentialExecutor.execute(loadTestTask);
        }
    }

    public List<TestRunConfig> getResults() {
        return testRunRepository.findAll();
    }

    public List<TestRunConfig> getResultsByNameOrId(String input) {
        return testRunRepository.findAll(hasNameOrId(input));
    }

    // Represents the following SQL:
    // SELECT * FROM LOAD_TEST_RESULTS WHERE testName = input OR testId = input
    private Specification<TestRunConfig> hasNameOrId(String input){
        return (root, query, criteriaBuilder)->
                criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("testName"), input),
                        criteriaBuilder.equal(
                                root.get("testId").<String> get("testId"), input) // testId is nested in key object
                );
    }
}