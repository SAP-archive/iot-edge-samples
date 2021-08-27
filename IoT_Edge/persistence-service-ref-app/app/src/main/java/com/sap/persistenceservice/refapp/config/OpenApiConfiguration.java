package com.sap.persistenceservice.refapp.config;

import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

@Configuration
public class OpenApiConfiguration {

    /**
     * 
     * @return
     */
    @Bean
    public GroupedOpenApi groupedOpenApi() {
        return GroupedOpenApi.builder().group("").pathsToMatch("/**")
            .build();
    }

    /**
     * 
     * @return
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(new Info().title("Persistence Service Reference Application")
            .description("Provides Interface to access the APIs exposed by Persistence Service").version("1.0.0")
            .license(new License().name("Terms of Use")
                .url("https://help.hana.ondemand.com/terms_of_use.html")));
    }

}
