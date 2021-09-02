package com.sap.persistenceservicerefapp;

import org.junit.ClassRule;
import org.junit.Test;
import org.junit.contrib.java.lang.system.EnvironmentVariables;
import org.junit.runner.RunWith;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;

import com.sap.persistenceservice.refapp.PersistenceServiceRefAppApplication;
import com.sap.persistenceservice.refapp.utils.Constants;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = PersistenceServiceRefAppApplication.class, webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = { "LOCAL_TEST=true" })
@ActiveProfiles(Constants.TEST_PROFILE)
@AutoConfigureMockMvc
@TestExecutionListeners({ DependencyInjectionTestExecutionListener.class })
public class PersistenceServiceRefAppApplicationTest {

    @ClassRule
    public static final EnvironmentVariables environmentVariables = new EnvironmentVariables()
        .set("LOCAL_TEST", "true");

    @Test
    public void testContextLoad() {
        // Do nothing
    }

}
