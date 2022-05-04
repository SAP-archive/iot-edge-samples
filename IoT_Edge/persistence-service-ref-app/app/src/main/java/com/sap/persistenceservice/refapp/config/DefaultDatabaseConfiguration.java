package com.sap.persistenceservice.refapp.config;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.sap.persistenceservice.refapp.bean.SchemaBean;
import com.sap.persistenceservice.refapp.defaultds.entity.PurchaseOrder;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@Configuration
@ConditionalOnProperty(name = "CUSTOM_EXTENSION", havingValue = "false")
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = {
    "com.sap.persistenceservice.refapp.defaultds.repository" }, entityManagerFactoryRef = "refAppDefaultEntityManager", transactionManagerRef = "refAppDefaultTransactionManager")
public class DefaultDatabaseConfiguration {

    private static final Logger log = LoggerFactory.getLogger(DefaultDatabaseConfiguration.class);

    @PostConstruct
    public void init() {
        log.info("DefaultDatabaseConfiguration is loaded");
    }

    @Bean(name = "refAppDefaultDatasource")
    public DataSource refAppDefaultDatasource(SchemaGenerator schemaGenerator) throws SQLException {

        org.apache.tomcat.jdbc.pool.DataSource dataSource = new org.apache.tomcat.jdbc.pool.DataSource();

        SchemaBean schemaBean = schemaGenerator.getDefaultSchema();

        if (RefAppEnv.LOCAL_TEST) {
            dataSource.setDriverClassName("org.h2.Driver");
            dataSource.setUsername("dba");
            dataSource.setPassword("sql");
            dataSource.setUrl("jdbc:h2:mem:db;DB_CLOSE_DELAY=-1;INIT=CREATE SCHEMA IF NOT EXISTS TEST");

        } else {

            // Connect to db
            dataSource.setDriverClassName(Constants.POSTGRES_DRIVER);
            dataSource.setUsername(schemaBean.getConfig().getUser());
            dataSource.setPassword(schemaBean.getConfig().getPassword());
            dataSource.setValidationQuery(Constants.POSTGRES_VALIDATION_QUERY);
            dataSource.setUrl(schemaBean.getConfig().getUri() + "?currentSchema=" + RefAppEnv.DEFAULT_SCHEMA);
        }

        dataSource.setInitialSize(Constants.CONNECTION_POOL_INITIAL_SIZE);
        dataSource.setMaxActive(Constants.CONNECTION_POOL_MAX_ACTIVE);
        dataSource.setMinIdle(Constants.CONNECTION_POOL_MIN_IDLE);
        dataSource.setMaxIdle(Constants.CONNECTION_POOL_MAX_IDLE);
        dataSource.setValidationInterval(Constants.CONNECTION_VALIDATION_INTERVAL);
        dataSource.setTestWhileIdle(Constants.CONNECTION_TEST_WHILE_IDLE);
        dataSource.setTestOnBorrow(Constants.CONNECTION_TEST_ON_BORROW);
        dataSource.setJmxEnabled(Constants.JMX_ENABLED);
        try (Connection conn = dataSource.getConnection()) {
            log.info("Successfully connected to the database");
        } catch (SQLException ex) {
            log.error("Error while establishing the database connection at the edge {}", ex.getMessage());
            throw new RuntimeException("Error while establishing jdbc connections at edge");// NOSONAR
        }

        return dataSource;
    }

    @Bean(name = "refAppDefaultEntityManager")
    public LocalContainerEntityManagerFactoryBean refAppDefaultEntityManager(SchemaGenerator schemaGenerator)
        throws SQLException {

        LocalContainerEntityManagerFactoryBean entityManager = new LocalContainerEntityManagerFactoryBean();
        entityManager.setDataSource(refAppDefaultDatasource(schemaGenerator));
        entityManager.setPackagesToScan(PurchaseOrder.class.getPackage().getName());
        entityManager.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        entityManager.setJpaProperties(getJpaProperties(schemaGenerator));
        return entityManager;
    }

    @Bean(name = "refAppDefaultTransactionManager")
    public PlatformTransactionManager refAppDefaultTransactionManager(SchemaGenerator schemaGenerator)
        throws SQLException {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(refAppDefaultEntityManager(schemaGenerator).getObject());
        return transactionManager;
    }

    /**
     * 
     * @return jpaProperties
     */
    private Properties getJpaProperties(SchemaGenerator schemaGenerator) {
        Properties jpaProperties = new Properties();
        jpaProperties.put("hibernate.jdbc.time_zone", "UTC");

        if (RefAppEnv.LOCAL_TEST) {
            jpaProperties.put("hibernate.default_schema", "TEST");
            jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.H2Dialect");
        } else {
            jpaProperties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQL82Dialect");
            jpaProperties.put("hibernate.default_schema", RefAppEnv.DEFAULT_SCHEMA);
        }

        if (log.isDebugEnabled()) {
            jpaProperties.put("hibernate.show_sql", "true");
            jpaProperties.put("hibernate.format_sql", "true");
        }
        jpaProperties.put("hibernate.hbm2ddl.auto", "update");

        return jpaProperties;
    }

}
