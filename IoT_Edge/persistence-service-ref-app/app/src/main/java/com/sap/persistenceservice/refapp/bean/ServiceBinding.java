package com.sap.persistenceservice.refapp.bean;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ServiceBinding {
	private List<ServiceBindingDetails> bindings;
}
