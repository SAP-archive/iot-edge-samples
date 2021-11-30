package com.sap.persistenceservice.refapp.config;

import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.sap.persistenceservice.refapp.utils.RefAppEnv;

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

        String title = "Persistence Service Reference Application";

        if (RefAppEnv.IS_CUSTOM_EXTENSION) {
            title = "Custom Extension";
        }

        return new OpenAPI().info(new Info().title(title)
            .description("Provides Interface to access the APIs exposed by Persistence Service").version("1.0.0")
            .license(new License().name("Terms of Use")
                .url("https://help.hana.ondemand.com/terms_of_use.html")));
    }

}
